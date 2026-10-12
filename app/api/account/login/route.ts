import { z } from "zod";
import { auth } from "@/lib/auth";
import { jsonError, jsonWithCookies } from "@/lib/api";
import { parseIdentifier } from "@/lib/identifier";
import { assertSameOrigin } from "@/lib/session";
import {
  clearAttempts,
  isThrottled,
  recordAttempt,
  requestIp,
} from "@/lib/throttle";

export const dynamic = "force-dynamic";

// Login with email OR phone + password. Every failure path returns the same
// generic message and status — a nonexistent identifier is indistinguishable
// from a wrong password. Per-identifier lockout + per-IP backstop.

const GENERIC = "Invalid credentials.";
const LOCKED = "Too many attempts. Try again in a few minutes.";

const Body = z.object({
  identifier: z.string().min(1).max(254),
  password: z.string().min(1).max(1024),
});

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return jsonError("Invalid request.", 403);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(GENERIC, 401);

  const id = parseIdentifier(parsed.data.identifier);
  if (!id) return jsonError(GENERIC, 401); // malformed identifier — same generic error

  const ipKey = `ip:${requestIp(req)}`;
  if (isThrottled("login", id.value).throttled || isThrottled("login", ipKey, 10).throttled) {
    return jsonError(LOCKED, 429);
  }

  try {
    const res =
      id.kind === "email"
        ? await auth.api.signInEmail({
            body: { email: id.value, password: parsed.data.password },
            asResponse: true,
          })
        : await auth.api.signInPhoneNumber({
            body: { phoneNumber: id.value, password: parsed.data.password },
            asResponse: true,
          });
    if (!res.ok) {
      recordAttempt("login", id.value);
      recordAttempt("login", ipKey);
      return jsonError(GENERIC, 401);
    }
    clearAttempts("login", id.value);
    return jsonWithCookies({ next: "/" }, res);
  } catch {
    // Thrown APIError (unknown user, wrong password, lockout hook) — all
    // collapse to the same generic response.
    recordAttempt("login", id.value);
    recordAttempt("login", ipKey);
    return jsonError(GENERIC, 401);
  }
}
