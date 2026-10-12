// Identifier normalization + format validation shared by signup, login and
// profile routes. Emails are stored lowercase; phone numbers are stored E.164.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const E164_RE = /^\+[1-9]\d{6,14}$/;
// Meta's own handle rules: 1–30 chars, letters/digits/dot/underscore.
const INSTAGRAM_RE = /^[A-Za-z0-9._]{1,30}$/;
const HANDLE_RE = /^[a-z0-9][a-z0-9-]{1,22}[a-z0-9]$/;

/** Domain for placeholder emails on phone-only signups (better-auth requires
 *  an email per user). `.invalid` is reserved (RFC 2606) so nothing can ever
 *  be delivered to it; these are hidden in the UI and excluded from
 *  "verified email" checks. */
export const PHONE_PLACEHOLDER_DOMAIN = "phone.kleos.invalid";

export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  return EMAIL_RE.test(email) && email.length <= 254 ? email : null;
}

/** Normalize to E.164. Bare 10-digit numbers are assumed US (+1) — a
 *  prototype convenience documented in the README. */
export function normalizePhone(raw: string): string | null {
  const stripped = raw.replace(/[\s().-]/g, "");
  const candidate = /^\d{10}$/.test(stripped)
    ? `+1${stripped}`
    : /^1\d{10}$/.test(stripped)
      ? `+${stripped}`
      : stripped;
  return E164_RE.test(candidate) ? candidate : null;
}

export type Identifier =
  | { kind: "email"; value: string }
  | { kind: "phone"; value: string };

/** Classify a login identifier as email or phone (normalized), else null. */
export function parseIdentifier(raw: string): Identifier | null {
  const trimmed = raw.trim();
  if (trimmed.includes("@")) {
    const email = normalizeEmail(trimmed);
    return email ? { kind: "email", value: email } : null;
  }
  const phone = normalizePhone(trimmed);
  return phone ? { kind: "phone", value: phone } : null;
}

export function placeholderEmailForPhone(phone: string): string {
  return `p${phone.replace(/\D/g, "")}@${PHONE_PLACEHOLDER_DOMAIN}`;
}

export function isPlaceholderEmail(email: string | null | undefined): boolean {
  return !!email && email.endsWith(`@${PHONE_PLACEHOLDER_DOMAIN}`);
}

export function isValidInstagramHandle(raw: string): boolean {
  return INSTAGRAM_RE.test(raw.replace(/^@/, ""));
}

export function isValidHandle(handle: string): boolean {
  return HANDLE_RE.test(handle);
}

/** Auto-suggest a trader handle from a display name: "Nelia K." → "nelia-k". */
export function suggestHandleBase(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20)
    .replace(/^-+|-+$/g, "");
  return base.length >= 3 ? base : `trader${base ? `-${base}` : ""}`;
}

/** 18+ signup gate per the platform guardrails (see SPEC.md). */
export function ageFromDob(dobIso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dobIso);
  if (!m) return null;
  const dob = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < dob.getUTCMonth() ||
    (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 120 ? age : null;
}
