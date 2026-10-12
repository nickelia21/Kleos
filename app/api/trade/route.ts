import { NextResponse } from "next/server";
import { z } from "zod";
import { executeTrade } from "@/lib/store";
import { assertSameOrigin, getRequestUser, tradeGate } from "@/lib/session";

export const dynamic = "force-dynamic";

const Body = z.object({
  vipId: z.string().min(1).max(64),
  side: z.enum(["buy", "sell"]),
  shares: z.number().finite().positive(),
});

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 403 });
  }
  const user = await getRequestUser(req);
  // Verification (and the 18+ DOB) is required before the first trade.
  const gate = tradeGate(user);
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const { vipId, side, shares } = parsed.data;
  const result = executeTrade(user!.id, vipId, side, shares);
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
