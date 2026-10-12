"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import type { PasswordCheck } from "@/lib/password-policy";
import { inputCls, labelCls, primaryBtnCls } from "./AuthCard";
import { PasswordMeter } from "./PasswordMeter";

// Completes an email-link password reset (?token=… from the dev mailer).

export function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token");
  const linkError = params.get("error");
  const [password, setPassword] = useState("");
  const [check, setCheck] = useState<PasswordCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (linkError || !token) {
    return (
      <div className="text-sm text-muted leading-relaxed">
        <p className="text-loss">This reset link is invalid or has expired.</p>
        <p className="mt-3 text-xs">
          <Link href="/forgot-password" className="text-coral hover:text-coral-soft">
            Request a new one →
          </Link>
        </p>
      </div>
    );
  }

  if (done) {
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !check?.ok || !token) return;
    setBusy(true);
    setError(null);
    const res = await authClient.resetPassword({ newPassword: password, token });
    if (res.error) {
      setError(res.error.message ?? "This reset link is invalid or has expired.");
      setBusy(false);
      return;
    }
    setDone(true);
  }

  return (
    <form onSubmit={submit} noValidate>
      <label className={labelCls} htmlFor="rp-pw">
        New password
      </label>
      <input
        id="rp-pw"
        className={inputCls}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        maxLength={128}
        autoComplete="new-password"
        autoFocus
      />
      <PasswordMeter password={password} onCheck={setCheck} />
      {error && <p className="mt-3 text-xs text-loss">{error}</p>}
      <button type="submit" disabled={busy || !check?.ok} className={primaryBtnCls}>
        {busy ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}
