import crypto from "node:crypto";
import { getDb } from "./db";

// ---------------------------------------------------------------------------
// Per-identifier and per-IP throttling for login / OTP / forgot-password.
// Failed attempts are recorded and counted over a rolling window; crossing
// the threshold locks the identifier out until the window drains. Identifiers
// are stored as SHA-256 hashes so no emails/phones/IPs land in this table.
// better-auth's own per-IP rate limiter additionally covers its raw
// /api/auth/* endpoints (see rateLimit in lib/auth.ts).
// ---------------------------------------------------------------------------

type Kind = "login" | "otp" | "forgot";

const RULES: Record<Kind, { windowMs: number; max: number }> = {
  login: { windowMs: 15 * 60_000, max: 5 }, // 5 failures / 15 min → lockout
  otp: { windowMs: 10 * 60_000, max: 4 }, // 4 sends / 10 min per phone
  forgot: { windowMs: 15 * 60_000, max: 4 },
};

function hashId(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function prune(kind: Kind) {
  getDb()
    .prepare("DELETE FROM auth_throttle WHERE kind = ? AND ts < ?")
    .run(kind, Date.now() - RULES[kind].windowMs);
}

/** Record a failed login / an OTP or reset send. */
export function recordAttempt(kind: Kind, identifier: string) {
  prune(kind);
  getDb()
    .prepare("INSERT INTO auth_throttle (idHash, kind, ts) VALUES (?, ?, ?)")
    .run(hashId(identifier), kind, Date.now());
}

/** True when the identifier has exhausted its window. `multiplier` loosens
 *  the cap for coarse keys (per-IP backstops sit above per-identifier). */
export function isThrottled(
  kind: Kind,
  identifier: string,
  multiplier = 1
): { throttled: boolean; retryAfterSec: number } {
  prune(kind);
  const rule = RULES[kind];
  const max = rule.max * multiplier;
  const rows = getDb()
    .prepare("SELECT ts FROM auth_throttle WHERE idHash = ? AND kind = ? ORDER BY ts ASC")
    .all(hashId(identifier), kind) as { ts: number }[];
  if (rows.length < max) return { throttled: false, retryAfterSec: 0 };
  const oldest = rows[rows.length - max].ts;
  return {
    throttled: true,
    retryAfterSec: Math.max(1, Math.ceil((oldest + rule.windowMs - Date.now()) / 1000)),
  };
}

/** Successful login clears the identifier's failure history. */
export function clearAttempts(kind: Kind, identifier: string) {
  getDb()
    .prepare("DELETE FROM auth_throttle WHERE idHash = ? AND kind = ?")
    .run(hashId(identifier), kind);
}

/** Best-effort client IP for per-IP throttling (dev: ::1 is fine). */
export function requestIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : null) || req.headers.get("x-real-ip") || "local";
}
