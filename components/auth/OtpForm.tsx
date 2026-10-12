"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { inputCls, primaryBtnCls } from "./AuthCard";

export function OtpForm({ phone }: { phone: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (busy || code.length !== 6) return;
    setBusy(true);
    setError(null);
    const res = await authClient.phoneNumber.verify({ phoneNumber: phone, code });
    if (res.error) {
      setError(
        res.error.status === 429
          ? (res.error.message ?? "Too many attempts — request a new code.")
          : "Invalid or expired code."
      );
      setBusy(false);
      return;
    }
    router.push("/onboarding?verified=1");
    router.refresh();
  }

  async function resend() {
    setError(null);
    setInfo(null);
    const res = await authClient.phoneNumber.sendOtp({ phoneNumber: phone });
    setInfo(
      res.error
        ? (res.error.message ?? "Could not send a new code — try again shortly.")
        : "New code sent — check the dev-server console."
    );
  }

  return (
    <form onSubmit={verify} noValidate>
      <label className="block text-xs text-muted mb-1.5" htmlFor="otp">
        6-digit code
      </label>
      <input
        id="otp"
        className={`${inputCls} tabular text-center text-lg tracking-[0.5em]`}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        placeholder="••••••"
      />
      {error && <p className="mt-3 text-xs text-loss">{error}</p>}
      {info && <p className="mt-3 text-xs text-muted">{info}</p>}
      <button type="submit" disabled={busy || code.length !== 6} className={primaryBtnCls}>
        {busy ? "Verifying…" : "Verify phone"}
      </button>
      <button
        type="button"
        onClick={resend}
        className="mt-3 w-full text-center text-xs text-muted hover:text-cream transition-colors"
      >
        Resend code
      </button>
    </form>
  );
}
