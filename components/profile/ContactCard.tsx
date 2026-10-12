"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

// Verified contact status. Verification (email link or phone OTP) is what
// unlocks trading.

function Badge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="rounded-md border border-gain/40 bg-gain/10 px-2 py-0.5 text-[11px] text-gain">
      ✓ Verified
    </span>
  ) : (
    <span className="rounded-md border border-amber/40 bg-amber/10 px-2 py-0.5 text-[11px] text-amber">
      Unverified
    </span>
  );
}

export function ContactCard({
  email,
  emailVerified,
  phone,
  phoneVerified,
}: {
  email: string | null; // null → phone-only account (placeholder hidden)
  emailVerified: boolean;
  phone: string | null;
  phoneVerified: boolean;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function resendEmail() {
    if (!email) return;
    setBusy(true);
    const res = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/profile",
    });
    setStatus(
      res.error
        ? (res.error.message ?? "Could not resend — try again shortly.")
        : "Verification link sent — check the dev-server console."
    );
    setBusy(false);
  }

  return (
    <section className="rounded-xl border border-line bg-panel p-5">
      <h2 className="kicker mb-4">Verified contact</h2>
      <div className="space-y-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted w-14 text-xs">Email</span>
          {email ? (
            <>
              <span className="text-cream">{email}</span>
              <Badge ok={emailVerified} />
              {!emailVerified && (
                <button
                  onClick={resendEmail}
                  disabled={busy}
                  className="text-[11px] text-coral hover:text-coral-soft transition-colors disabled:opacity-50"
                >
                  Resend link
                </button>
              )}
            </>
          ) : (
            <span className="text-faint text-xs">None on file (phone-only account)</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted w-14 text-xs">Phone</span>
          {phone ? (
            <>
              <span className="text-cream tabular">{phone}</span>
              <Badge ok={phoneVerified} />
              {!phoneVerified && (
                <Link
                  href="/verify-phone"
                  className="text-[11px] text-coral hover:text-coral-soft transition-colors"
                >
                  Verify now
                </Link>
              )}
            </>
          ) : (
            <span className="text-faint text-xs">None on file</span>
          )}
        </div>
      </div>
      {status && <p className="mt-3 text-xs text-muted">{status}</p>}
      {!emailVerified && !phoneVerified && (
        <p className="mt-3 text-[11px] text-amber leading-relaxed">
          Verify at least one contact method to unlock trading.
        </p>
      )}
    </section>
  );
}
