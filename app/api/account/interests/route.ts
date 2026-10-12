import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api";
import { setPickedInterests } from "@/lib/interests";
import { assertSameOrigin, getRequestUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// Saves the "Which creators and VIPs do you follow?" picks — from the
// onboarding step or the profile editor. Free-text names feed the VIP
// recruiting pipeline (/admin/recruiting).

const Body = z.object({
  vipIds: z.array(z.string().max(64)).max(50),
  freeText: z.array(z.string().max(80)).max(20),
});

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return jsonError("Invalid request.", 403);
  const user = await getRequestUser(req);
  if (!user) return jsonError("Sign in required.", 401);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid request.");
  setPickedInterests(user.id, parsed.data.vipIds, parsed.data.freeText);
  return jsonOk();
}
