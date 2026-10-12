import { NextResponse } from "next/server";
import { GOOGLE_MODE } from "@/lib/auth";
import { decodeMockCode } from "@/lib/mock-google";

// DEV MOCK Google — token endpoint. The signed authorization code doubles as
// the access token (stateless mock).

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (GOOGLE_MODE !== "mock") {
    return NextResponse.json({ error: "mock disabled" }, { status: 404 });
  }
  const form = await req.formData().catch(() => null);
  const code = form?.get("code");
  if (typeof code !== "string" || !decodeMockCode(code)) {
    return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
  }
  return NextResponse.json({
    access_token: code,
    token_type: "Bearer",
    expires_in: 300,
    scope: "openid email profile",
  });
}
