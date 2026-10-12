import { NextResponse } from "next/server";
import { GOOGLE_MODE } from "@/lib/auth";
import { normalizeEmail } from "@/lib/identifier";
import { encodeMockCode } from "@/lib/mock-google";

// DEV MOCK Google — authorization endpoint. Shows an unmistakably-labeled
// account picker instead of Google's. Active only while no real Google keys
// are configured (GOOGLE_MODE === "mock").

export const dynamic = "force-dynamic";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

export async function GET(req: Request) {
  if (GOOGLE_MODE !== "mock") {
    return NextResponse.json({ error: "mock disabled" }, { status: 404 });
  }
  const url = new URL(req.url);
  const redirectUri = url.searchParams.get("redirect_uri") ?? "";
  const state = url.searchParams.get("state") ?? "";
  // Only redirect back into this app's own better-auth callback.
  const expectedCallback = `${url.origin}/api/auth/oauth2/callback/google`;
  if (redirectUri !== expectedCallback) {
    return NextResponse.json({ error: "bad redirect_uri" }, { status: 400 });
  }

  const submittedEmail = url.searchParams.get("mock_email");
  if (submittedEmail !== null) {
    const email = normalizeEmail(submittedEmail);
    if (!email) {
      return NextResponse.json({ error: "invalid email" }, { status: 400 });
    }
    const name =
      (url.searchParams.get("mock_name") ?? "").trim().slice(0, 60) ||
      email.split("@")[0];
    const back = new URL(redirectUri);
    back.searchParams.set("code", encodeMockCode(email, name));
    back.searchParams.set("state", state);
    return NextResponse.redirect(back);
  }

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>DEV MOCK · Google Sign-In</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#f1f3f4;font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;color:#202124}
  .card{background:#fff;border:1px solid #dadce0;border-radius:12px;padding:36px;width:min(400px,90vw)}
  .banner{background:#fef7e0;border:1px solid #f9ab00;border-radius:8px;padding:10px 12px;
    font-size:12px;line-height:1.5;margin-bottom:20px;color:#7a5b00}
  h1{font-size:20px;font-weight:500;margin:0 0 6px}
  p{font-size:13px;color:#5f6368;margin:0 0 20px}
  label{display:block;font-size:12px;color:#5f6368;margin:14px 0 4px}
  input{width:100%;box-sizing:border-box;border:1px solid #dadce0;border-radius:6px;
    padding:10px 12px;font-size:14px}
  button{margin-top:22px;width:100%;background:#1a73e8;color:#fff;border:0;border-radius:6px;
    padding:11px;font-size:14px;font-weight:500;cursor:pointer}
  button:hover{background:#1765cc}
</style></head><body>
  <div class="card">
    <div class="banner"><strong>DEV MOCK</strong> — this is Kleos's local stand-in for Google
      (no real Google keys configured). Nothing leaves your machine. Enter any email to
      simulate picking that Google account.</div>
    <h1>Sign in with Google</h1>
    <p>to continue to <strong>Kleos</strong> (localhost)</p>
    <form method="GET" action="/api/dev/mock-google/authorize">
      <input type="hidden" name="redirect_uri" value="${esc(redirectUri)}">
      <input type="hidden" name="state" value="${esc(state)}">
      <label for="e">Google account email</label>
      <input id="e" name="mock_email" type="email" required placeholder="you@gmail.com" autofocus>
      <label for="n">Display name</label>
      <input id="n" name="mock_name" type="text" placeholder="Your Name">
      <button type="submit">Continue as this account</button>
    </form>
  </div>
</body></html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
