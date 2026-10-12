import { z } from "zod";
import { auth } from "@/lib/auth";
import { authErrorInfo, jsonError, jsonOk } from "@/lib/api";
import { getDb } from "@/lib/db";
import { checkPassword } from "@/lib/password-policy";
import { assertSameOrigin, getRequestUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// Adds a password sign-in method to a trader who signed up via Google (no
// credential identity yet). Changing an existing password goes through
// better-auth's /change-password with the current password instead.

const Body = z.object({ newPassword: z.string().min(1).max(1024) });

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return jsonError("Invalid request.", 403);
  const user = await getRequestUser(req);
  if (!user) return jsonError("Sign in required.", 401);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid request.");

  const hasCredential = getDb()
    .prepare("SELECT 1 FROM account WHERE userId = ? AND providerId = 'credential'")
    .get(user.id);
  if (hasCredential) {
    return jsonError("You already have a password — use Change password instead.", 409);
  }

  // Same policy as signup (also enforced in the auth before hook).
  const check = checkPassword(parsed.data.newPassword, [user.email, user.name]);
  if (!check.ok) return jsonError(check.error ?? "Password too weak.");

  try {
    await auth.api.setPassword({
      body: { newPassword: parsed.data.newPassword },
      headers: req.headers,
    });
    return jsonOk();
  } catch (e) {
    const { message, status } = authErrorInfo(e);
    return jsonError(message, status);
  }
}
