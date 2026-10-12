import { NextResponse } from "next/server";
import { z } from "zod";
import { toggleWatch } from "@/lib/store";
import { assertSameOrigin, getRequestUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const Body = z.object({ vipId: z.string().min(1).max(64) });

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 403 });
  }
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Sign in to build a watchlist." },
      { status: 401 }
    );
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  return NextResponse.json({ ok: true, ...toggleWatch(user.id, parsed.data.vipId) });
}
