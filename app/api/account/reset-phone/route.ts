import { z } from "zod";
import { auth } from "@/lib/auth";
import { authErrorInfo, jsonError, jsonOk } from "@/lib/api";
import { normalizePhone } from "@/lib/identifier";
import { assertSameOrigin } from "@/lib/session";

export const dynamic = "force-dynamic";

// Completes a phone-based password reset: OTP + new password in one step.
// Password policy is enforced by the before hook on
// /phone-number/reset-password (lib/auth.ts).

const Body = z.object({
  phone: z.string().min(1).max(32),
  otp: z.string().regex(/^\d{6}$/),
  newPassword: z.string().min(1).max(1024),
});

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return jsonError("Invalid request.", 403);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid request.");

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return jsonError("Invalid or expired code.", 400);

  try {
    await auth.api.resetPasswordPhoneNumber({
      body: {
        phoneNumber: phone,
        otp: parsed.data.otp,
        newPassword: parsed.data.newPassword,
      },
    });
    return jsonOk();
  } catch (e) {
    const { message, status } = authErrorInfo(e);
    // Pass through policy errors (400 from our hook); collapse everything
    // else (bad OTP, unknown phone) into one neutral message.
    if (status === 400 && message !== "Request failed.") {
      return jsonError(message, 400);
    }
    return jsonError("Invalid or expired code.", 400);
  }
}
