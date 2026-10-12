import crypto from "node:crypto";

// Helpers for the DEV MOCK Google provider (app/api/dev/mock-google/*).
// The "authorization code" is a signed, short-lived token carrying the chosen
// mock profile — stateless, and not forgeable into arbitrary-email sign-ins.

const SECRET = process.env.BETTER_AUTH_SECRET ?? "kleos-dev-secret-do-not-use-in-prod";

export interface MockProfile {
  sub: string;
  email: string;
  name: string;
  exp: number;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function encodeMockCode(email: string, name: string): string {
  const profile: MockProfile = {
    // Stable sub per email — repeat sign-ins resolve to the same Google identity.
    sub: `mock-google-${crypto.createHash("sha256").update(email).digest("hex").slice(0, 16)}`,
    email,
    name,
    exp: Date.now() + 5 * 60_000,
  };
  const payload = Buffer.from(JSON.stringify(profile)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeMockCode(code: string): MockProfile | null {
  const [payload, sig] = code.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  try {
    const profile = JSON.parse(Buffer.from(payload, "base64url").toString()) as MockProfile;
    return profile.exp > Date.now() ? profile : null;
  } catch {
    return null;
  }
}
