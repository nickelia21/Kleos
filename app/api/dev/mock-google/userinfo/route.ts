import { NextResponse } from "next/server";
import { GOOGLE_MODE } from "@/lib/auth";
import { decodeMockCode } from "@/lib/mock-google";

// DEV MOCK Google — userinfo endpoint.

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (GOOGLE_MODE !== "mock") {
    return NextResponse.json({ error: "mock disabled" }, { status: 404 });
  }
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const profile = decodeMockCode(bearer);
  if (!profile) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }
  return NextResponse.json({
    sub: profile.sub,
    email: profile.email,
    email_verified: true,
    name: profile.name,
  });
}
