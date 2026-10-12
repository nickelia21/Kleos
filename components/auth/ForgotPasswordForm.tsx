"use client";

import Link from "next/link";
import { useState } from "react";
import type { PasswordCheck } from "@/lib/password-policy";
import { inputCls, labelCls, primaryBtnCls } from "./AuthCard";
import { PasswordMeter } from "./PasswordMeter";

// Forgot password: email identifiers get a reset link (dev mailer → console),
// phone identifiers continue inline with an OTP + new password.

type Step = "identify" | "email-sent" | "phone-reset" | "done";

export function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>("identify");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [check, setCheck] = useState<PasswordCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function request(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !identifier.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Something went wrong.");
      } else {
        setStep(json.kind === "phone" ? "phone-reset" : "email-sent");
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resetWithOtp(e: React.FormEvent) {
    e.preventDefault();
    if (busy || otp.length !== 6 || !check?.ok) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/reset-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: identifier.trim(), otp, newPassword: password }),
      });
      const json = await res.json();
      if (json.ok) setStep("done");
      else setError(json.error ?? "Invalid or expired code.");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (step === "email-sent") {
    return (
      <div className="text-sm text-muted leading-relaxed">
        <p>
          If an account exists for{" "}
          <span className="text-cream">{identifier.trim()}</span>, a reset link
          is on its way.
        </p>
        <div className="mt-4 rounded-lg border border-amber/40 bg-amber/10 p-3 text-xs leading-relaxed text-amber">
          Prototype: the link is printed to the{" "}
          <span className="font-semibold">npm run dev</span> terminal.
        </div>
        <p className="mt-5 text-xs">
          <Link href="/login" className="text-coral hover:text-coral-soft">
            ← Back to log in
          </Link>
        </p>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="text-sm text-muted leading-relaxed">
        <p className="text-gain">Password updated.</p>
        <p className="mt-2">All other sessions were signed out.</p>
        <p className="mt-5">
          <Link
            href="/login"
            className="inline-block rounded-lg bg-coral text-bg px-4 py-2 text-xs font-semibold hover:bg-coral-soft transition-colors"
          >
            Log in with your new password
          </Link>
        </p>
      </div>
    );
  }

  if (step === "phone-reset") {
    return (
      <form onSubmit={resetWithOtp} noValidate>
        <p className="text-xs text-muted leading-relaxed mb-4">
          If an account exists for{" "}
          <span className="text-cream">{identifier.trim()}</span>, we texted it
          a 6-digit reset code{" "}
          <span className="text-faint">(prototype: printed to the dev console)</span>.
        </p>
        <label className={labelCls} htmlFor="fp-otp">
          6-digit code
        </label>
        <input
          id="fp-otp"
          className={`${inputCls} tabular text-center tracking-[0.5em]`}
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          placeholder="••••••"
        />
        <label className={labelCls} htmlFor="fp-pw">
          New password
        </label>
        <input
          id="fp-pw"
          className={inputCls}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          maxLength={128}
          autoComplete="new-password"
        />
        <PasswordMeter password={password} userInputs={[identifier]} onCheck={setCheck} />
        {error && <p className="mt-3 text-xs text-loss">{error}</p>}
        <button
          type="submit"
          disabled={busy || otp.length !== 6 || !check?.ok}
          className={primaryBtnCls}
        >
          {busy ? "Resetting…" : "Reset password"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={request} noValidate>
      <label className={labelCls} htmlFor="fp-id">
        Email or phone number
      </label>
      <input
        id="fp-id"
        className={inputCls}
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        placeholder="you@example.com · +1 555 123 4567"
        autoComplete="username"
      />
      {error && <p className="mt-3 text-xs text-loss">{error}</p>}
      <button type="submit" disabled={busy || !identifier.trim()} className={primaryBtnCls}>
        {busy ? "Checking…" : "Send reset instructions"}
      </button>
      <p className="mt-5 text-center text-xs text-muted">
        <Link href="/login" className="text-coral hover:text-coral-soft">
          ← Back to log in
        </Link>
      </p>
    </form>
  );
}
