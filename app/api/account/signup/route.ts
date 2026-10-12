import { z } from "zod";
import { auth } from "@/lib/auth";
import { authErrorInfo, jsonError, jsonWithCookies } from "@/lib/api";
import { getDb } from "@/lib/db";
import {
  normalizeEmail,
  normalizePhone,
  placeholderEmailForPhone,
} from "@/lib/identifier";
import { assertSameOrigin } from "@/lib/session";

export const dynamic = "force-dynamic";

// Trader signup with email OR phone (user's choice). Delegates to
// better-auth's sign-up endpoint — the before hook in lib/auth.ts enforces
// password policy and the 18+ DOB gate there, so this route stays a thin
// normalization + phone-bootstrap layer.

const Body = z.object({
  mode: z.enum(["email", "phone"]),
  identifier: z.string().min(1).max(254),
  displayName: z.string().trim().min(2).max(60),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  password: z.string().min(1).max(1024),
});

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return jsonError("Invalid request.", 403);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid request.");
  const { mode, identifier, displayName, dob, password } = parsed.data;

  if (mode === "email") {
    const email = normalizeEmail(identifier);
    if (!email) return jsonError("Enter a valid email address.");
    try {
      const res = await auth.api.signUpEmail({
        body: {
          name: displayName,
          email,
          password,
          dob,
          // Where the email verification link lands after success:
          callbackURL: "/onboarding?verified=1",
        },
        asResponse: true,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        return jsonError(body?.message ?? "Sign up failed.", res.status);
      }
      return jsonWithCookies({ next: "/verify-email" }, res);
    } catch (e) {
      const { message, status } = authErrorInfo(e);
      return jsonError(message, status);
    }
  }

  // Phone signup. better-auth requires an email per user, so phone-only
  // traders get a placeholder on the reserved .invalid TLD (hidden in the UI,
  // excluded from verification checks) and verify via SMS OTP instead.
  const phone = normalizePhone(identifier);
  if (!phone) return jsonError("Enter a valid phone number (E.164, e.g. +15551234567).");
  const taken = getDb().prepare("SELECT 1 FROM user WHERE phoneNumber = ?").get(phone);
  if (taken) return jsonError("That phone number is already registered.", 422);

  try {
    const res = await auth.api.signUpEmail({
      body: {
        name: displayName,
        email: placeholderEmailForPhone(phone),
        password,
        dob,
      },
      asResponse: true,
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      return jsonError(body?.message ?? "Sign up failed.", res.status);
    }
    const created = (await res.json()) as { user?: { id?: string } };
    const userId = created.user?.id;
    if (!userId) return jsonError("Sign up failed.", 500);
    getDb()
      .prepare("UPDATE user SET phoneNumber = ?, phoneNumberVerified = 0 WHERE id = ?")
      .run(phone, userId);
    await auth.api.sendPhoneNumberOTP({ body: { phoneNumber: phone } });
    return jsonWithCookies({ next: "/verify-phone" }, res);
  } catch (e) {
    const { message, status } = authErrorInfo(e);
    return jsonError(message, status);
  }
}
