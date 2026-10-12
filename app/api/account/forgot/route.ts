import { z } from "zod";
import { auth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { parseIdentifier } from "@/lib/identifier";
import { assertSameOrigin } from "@/lib/session";

export const dynamic = "force-dynamic";

// Forgot password. Email identifiers get a reset link via the dev mailer;
// phone identifiers get a reset OTP via the dev SMS mock. Always responds
// success so the route can't be used to probe which identifiers exist.
// Per-identifier send throttles live in the lib/auth.ts before hook.

const Body = z.object({ identifier: z.string().min(1).max(254) });

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return jsonError("Invalid request.", 403);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid request.");

  const id = parseIdentifier(parsed.data.identifier);
  if (!id) {
    // Even malformed input gets a neutral answer; the client validates format.
    return jsonOk({ kind: "email" });
  }

  try {
    if (id.kind === "email") {
      await auth.api.requestPasswordReset({
        body: { email: id.value, redirectTo: "/reset-password" },
      });
    } else {
      await auth.api.requestPasswordResetPhoneNumber({
        body: { phoneNumber: id.value },
      });
    }
  } catch {
    // Unknown identifier / throttled — deliberately indistinguishable.
  }
  return jsonOk({ kind: id.kind });
}
