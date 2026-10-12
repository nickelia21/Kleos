import { NextResponse } from "next/server";
import { APIError } from "better-auth/api";

// Small shared helpers for Kleos's own /api/account/* route handlers.

export function jsonOk(data: Record<string, unknown> = {}, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

export function jsonError(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

/** Forward better-auth's Set-Cookie headers (session, CSRF) onto our response. */
export function jsonWithCookies(
  data: Record<string, unknown>,
  from: Response,
  status = 200
) {
  const res = NextResponse.json({ ok: true, ...data }, { status });
  for (const cookie of from.headers.getSetCookie()) {
    res.headers.append("set-cookie", cookie);
  }
  return res;
}

/** Normalize a thrown better-auth APIError into {message, status}. */
export function authErrorInfo(e: unknown): { message: string; status: number } {
  if (e instanceof APIError) {
    return {
      message: e.body?.message ?? "Request failed.",
      status: typeof e.statusCode === "number" ? e.statusCode : 400,
    };
  }
  return { message: "Request failed.", status: 500 };
}
