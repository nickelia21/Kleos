"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function VerifyEmailActions({ email }: { email: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function resend() {
    setBusy(true);
    setStatus(null);
    const res = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/onboarding?verified=1",
    });
    setStatus(
      res.error
        ? (res.error.message ?? "Could not resend — try again shortly.")
        : "Sent — check the dev-server console for the new link."
    );
    setBusy(false);
  }

  return (
    <div className="mt-5">
      <button
        onClick={resend}
        disabled={busy}
        className="rounded-lg border border-line px-4 py-2 text-xs font-medium text-muted hover:text-cream hover:border-faint transition-colors disabled:opacity-50"
      >
        {busy ? "Sending…" : "Resend verification link"}
      </button>
      {status && <p className="mt-2 text-xs text-muted">{status}</p>}
    </div>
  );
}
