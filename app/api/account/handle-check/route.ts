import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isValidHandle } from "@/lib/identifier";
import { getRequestUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// Live @handle availability check for the profile editor.
export async function GET(req: Request) {
  const handle = (new URL(req.url).searchParams.get("handle") ?? "").toLowerCase();
  if (!isValidHandle(handle)) {
    return NextResponse.json({ ok: true, valid: false, available: false });
  }
  const me = await getRequestUser(req);
  const owner = getDb().prepare("SELECT id FROM user WHERE handle = ?").get(handle) as
    | { id: string }
    | undefined;
  return NextResponse.json({
    ok: true,
    valid: true,
    available: !owner || owner.id === me?.id,
  });
}
