import { headers } from "next/headers";
import { auth } from "./auth";
import { ageFromDob, isPlaceholderEmail } from "./identifier";

// Server-side session helpers. Client components use lib/auth-client.ts.

export interface TraderUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  phoneNumber?: string | null;
  phoneNumberVerified?: boolean | null;
  handle?: string | null;
  dob?: string | null;
  instagramHandle?: string | null;
  deletedAt?: Date | string | null;
  balance: number;
  realizedPnl: number;
  createdAt: Date | string;
}

export async function getSessionUser(): Promise<TraderUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const user = session.user as unknown as TraderUser;
  return user.deletedAt ? null : user;
}

/** Same as getSessionUser but for route handlers with a Request in hand. */
export async function getRequestUser(req: Request): Promise<TraderUser | null> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return null;
  const user = session.user as unknown as TraderUser;
  return user.deletedAt ? null : user;
}

/** A real (non-placeholder) verified email, or a verified phone. */
export function hasVerifiedContact(u: TraderUser): boolean {
  return (u.emailVerified && !isPlaceholderEmail(u.email)) || !!u.phoneNumberVerified;
}

export function isAdult(u: TraderUser): boolean {
  const age = u.dob ? ageFromDob(u.dob) : null;
  return age !== null && age >= 18;
}

export type TradeGate =
  | { ok: true }
  | { ok: false; status: 401 | 403; error: string };

/** Verification required before first trade; 18+ per platform guardrails. */
export function tradeGate(u: TraderUser | null): TradeGate {
  if (!u) return { ok: false, status: 401, error: "Sign in to trade." };
  if (!hasVerifiedContact(u)) {
    return {
      ok: false,
      status: 403,
      error: "Verify your email or phone before your first trade.",
    };
  }
  if (!isAdult(u)) {
    return {
      ok: false,
      status: 403,
      error: "Confirm your date of birth on your profile before trading (18+).",
    };
  }
  return { ok: true };
}

/** Origin check for Kleos's own mutating routes (better-auth covers its own).
 *  Sessions ride SameSite=Lax httpOnly cookies; this rejects the cross-origin
 *  POSTs that could still carry them. */
export function assertSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin fetch/curl — no Origin header to judge
  const host = req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
