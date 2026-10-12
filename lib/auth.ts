import { hash as argon2Hash, verify as argon2Verify } from "@node-rs/argon2";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { genericOAuth, phoneNumber } from "better-auth/plugins";
import { getDb } from "./db";
import {
  ageFromDob,
  isPlaceholderEmail,
  normalizeEmail,
  suggestHandleBase,
} from "./identifier";
import { mailer, sms } from "./notify";
import { checkPassword } from "./password-policy";
import { isThrottled, recordAttempt } from "./throttle";

// ---------------------------------------------------------------------------
// better-auth configuration (see README "Auth" for why better-auth over
// Auth.js). Sessions, cookies, CSRF/origin checks, verification tokens and
// account linking are all the library's — nothing hand-rolled. The before
// hook is the single enforcement point for password policy, the 18+ gate and
// per-identifier lockout, so hitting /api/auth/* directly can't bypass them.
// ---------------------------------------------------------------------------

export const BASE_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

/** Real Google when keys are configured, otherwise the clearly-labeled local
 *  dev mock (app/api/dev/mock-google) speaking real OAuth2 under the same
 *  "google" providerId — so account rows are identical either way. */
export const GOOGLE_MODE: "real" | "mock" =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? "real" : "mock";

// OWASP-recommended argon2id parameters (19 MiB, t=2, p=1). @node-rs/argon2
// defaults to the argon2id variant (hashes carry the "$argon2id$" prefix; the
// const-enum Algorithm export can't be referenced under isolatedModules).
const ARGON2_OPTS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

const GENERIC_LOCKOUT_MSG =
  "Too many attempts. Try again in a few minutes.";

/** Paths whose request body carries a new password to hold to policy. */
const PASSWORD_SETTING_PATHS = new Set([
  "/sign-up/email",
  "/reset-password",
  "/change-password",
  "/set-password",
  "/phone-number/reset-password",
]);

function generateUniqueHandle(name: string): string {
  const db = getDb();
  const base = suggestHandleBase(name || "trader");
  let handle = base;
  let n = 2;
  while (db.prepare("SELECT 1 FROM user WHERE handle = ?").get(handle)) {
    handle = `${base}${n++}`;
  }
  return handle;
}

export const auth = betterAuth({
  baseURL: BASE_URL,
  secret: process.env.BETTER_AUTH_SECRET ?? "kleos-dev-secret-do-not-use-in-prod",
  database: getDb(),
  telemetry: { enabled: false },

  user: {
    additionalFields: {
      handle: { type: "string", required: false, input: false },
      dob: { type: "string", required: false, input: true },
      instagramHandle: { type: "string", required: false, input: false },
      deletedAt: { type: "date", required: false, input: false },
      balance: { type: "number", required: false, defaultValue: 10_000, input: false },
      realizedPnl: { type: "number", required: false, defaultValue: 0, input: false },
    },
  },

  databaseHooks: {
    user: {
      create: {
        // Every new trader — password, phone or Google — gets a unique
        // @handle auto-suggested from their name (editable on /profile).
        before: async (user) => ({
          data: {
            ...user,
            handle:
              (user as { handle?: string }).handle ?? generateUniqueHandle(user.name),
          },
        }),
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    autoSignIn: true,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 3600,
    password: {
      hash: (password) => argon2Hash(password, ARGON2_OPTS),
      verify: ({ hash, password }) => argon2Verify(hash, password, ARGON2_OPTS),
    },
    sendResetPassword: async ({ user, url }) => {
      await mailer.sendMail({
        to: user.email,
        subject: "Reset your Kleos password",
        text: `Someone (hopefully you) asked to reset your Kleos password.\n\nReset link (valid 1 hour):\n${url}\n\nIf this wasn't you, ignore this email.`,
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      // Phone-only signups carry a placeholder @phone.kleos.invalid email —
      // never "send" anything to those.
      if (isPlaceholderEmail(user.email)) return;
      await mailer.sendMail({
        to: user.email,
        subject: "Verify your Kleos email",
        text: `Welcome to Kleos. Confirm your email to unlock trading:\n\n${url}\n\nYou must verify before your first trade.`,
      });
    },
  },

  socialProviders:
    GOOGLE_MODE === "real"
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          },
        }
      : undefined,

  account: {
    accountLinking: {
      enabled: true,
      // Google addresses arrive verified, so merging a Google identity into
      // the trader with the same verified email is safe (per spec).
      trustedProviders: ["google"],
    },
  },

  rateLimit: {
    // Per-IP limiter on the raw /api/auth/* endpoints, persisted in SQLite.
    // Complements the per-identifier lockout in lib/throttle.ts.
    enabled: true,
    storage: "database",
    modelName: "rateLimit",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 10 },
      "/sign-in/phone-number": { window: 60, max: 10 },
      "/sign-up/email": { window: 300, max: 10 },
      "/phone-number/send-otp": { window: 60, max: 5 },
      "/phone-number/verify": { window: 60, max: 10 },
      "/phone-number/request-password-reset": { window: 300, max: 5 },
      "/phone-number/reset-password": { window: 60, max: 5 },
      "/request-password-reset": { window: 300, max: 5 },
      "/reset-password": { window: 60, max: 5 },
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const body = (ctx.body ?? {}) as Record<string, unknown>;

      // -- Password policy (NIST 800-63B + zxcvbn ≥ 3 + common-list) on every
      //    endpoint that sets a password. lib/password-policy.ts is shared
      //    with the client meter.
      if (PASSWORD_SETTING_PATHS.has(ctx.path)) {
        const pw = body.newPassword ?? body.password;
        if (typeof pw === "string") {
          const userInputs = [body.email, body.name, body.phoneNumber]
            .filter((v): v is string => typeof v === "string")
            .flatMap((v) => v.split(/[@._\s+-]+/))
            .filter((v) => v.length >= 3);
          const check = checkPassword(pw, userInputs);
          if (!check.ok) {
            throw new APIError("BAD_REQUEST", { message: check.error });
          }
        }
      }

      // -- Signup gate: normalized email + required DOB with 18+ check.
      if (ctx.path === "/sign-up/email") {
        const rawEmail = typeof body.email === "string" ? body.email : "";
        let email = rawEmail;
        if (!isPlaceholderEmail(rawEmail)) {
          const norm = normalizeEmail(rawEmail);
          if (!norm) {
            throw new APIError("BAD_REQUEST", { message: "Enter a valid email address." });
          }
          email = norm;
        }
        const dob = typeof body.dob === "string" ? body.dob : "";
        const age = ageFromDob(dob);
        if (age === null) {
          throw new APIError("BAD_REQUEST", { message: "Enter a valid date of birth (YYYY-MM-DD)." });
        }
        if (age < 18) {
          // Neutral message per spec — no lecture, no detail echo.
          throw new APIError("FORBIDDEN", {
            message: "Kleos accounts are limited to adults. We can't open this account.",
          });
        }
        if (email !== rawEmail) {
          return { context: { ...ctx, body: { ...body, email } } };
        }
      }

      // -- Sign-in: honor per-identifier lockout (failures are recorded by
      //    /api/account/login; raw-endpoint brute force is additionally
      //    capped per-IP by the rateLimit rules above).
      if (ctx.path === "/sign-in/email" || ctx.path === "/sign-in/phone-number") {
        const identifier = String(body.email ?? body.phoneNumber ?? "");
        if (identifier && isThrottled("login", identifier).throttled) {
          throw new APIError("TOO_MANY_REQUESTS", { message: GENERIC_LOCKOUT_MSG });
        }
      }

      // -- OTP / reset sends: per-identifier send throttle.
      if (
        ctx.path === "/phone-number/send-otp" ||
        ctx.path === "/phone-number/request-password-reset"
      ) {
        const phone = String(body.phoneNumber ?? "");
        if (phone) {
          if (isThrottled("otp", phone).throttled) {
            throw new APIError("TOO_MANY_REQUESTS", { message: GENERIC_LOCKOUT_MSG });
          }
          recordAttempt("otp", phone);
        }
      }
      if (ctx.path === "/request-password-reset") {
        const email = String(body.email ?? "");
        if (email) {
          if (isThrottled("forgot", email).throttled) {
            throw new APIError("TOO_MANY_REQUESTS", { message: GENERIC_LOCKOUT_MSG });
          }
          recordAttempt("forgot", email);
        }
      }
    }),
  },

  plugins: [
    phoneNumber({
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 5,
      // Require pre-normalized E.164 — the UI normalizes before calling, and
      // direct API callers get a clean validation error instead of dirty data.
      phoneNumberValidator: (phone) => /^\+[1-9]\d{6,14}$/.test(phone),
      sendOTP: async ({ phoneNumber: to, code }) => {
        await sms.sendSms({
          to,
          body: `Your Kleos verification code is ${code}. It expires in 5 minutes.`,
        });
      },
      sendPasswordResetOTP: async ({ phoneNumber: to, code }) => {
        await sms.sendSms({
          to,
          body: `Your Kleos password reset code is ${code}. It expires in 5 minutes.`,
        });
      },
    }),
    ...(GOOGLE_MODE === "mock"
      ? [
          genericOAuth({
            config: [
              {
                // DEV MOCK Google — same providerId as the real thing so the
                // account table is identical when real keys are added later.
                providerId: "google",
                clientId: "kleos-dev-mock",
                clientSecret: "kleos-dev-mock-secret",
                authorizationUrl: `${BASE_URL}/api/dev/mock-google/authorize`,
                tokenUrl: `${BASE_URL}/api/dev/mock-google/token`,
                userInfoUrl: `${BASE_URL}/api/dev/mock-google/userinfo`,
                scopes: ["openid", "email", "profile"],
                pkce: false,
                getUserInfo: async (tokens) => {
                  const res = await fetch(`${BASE_URL}/api/dev/mock-google/userinfo`, {
                    headers: { Authorization: `Bearer ${tokens.accessToken}` },
                  });
                  if (!res.ok) return null;
                  const p = (await res.json()) as {
                    sub: string;
                    email: string;
                    name: string;
                    picture?: string;
                  };
                  return {
                    id: p.sub,
                    email: p.email,
                    emailVerified: true,
                    name: p.name,
                    image: p.picture,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };
                },
              },
            ],
          }),
        ]
      : []),
    nextCookies(), // keep last (better-auth docs)
  ],
});

export type ServerSession = typeof auth.$Infer.Session;
