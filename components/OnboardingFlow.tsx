"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { InterestPicker, type PickableVip } from "./InterestPicker";
import { inputCls } from "./auth/AuthCard";

// Post-signup onboarding: an optional DOB confirmation (only for accounts
// created via Google, which skipped the signup form) followed by the
// skippable interest picker. Reachable any time from the account menu.

export function OnboardingFlow({
  vips,
  initialVipIds,
  initialFreeText,
  needsDob,
}: {
  vips: PickableVip[];
  initialVipIds: string[];
  initialFreeText: string[];
  needsDob: boolean;
}) {
  const router = useRouter();
  const [dob, setDob] = useState("");
  const [dobDone, setDobDone] = useState(!needsDob);
  const [dobError, setDobError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function saveDob(e: React.FormEvent) {
    e.preventDefault();
    if (busy || dob.length !== 10) return;
    setBusy(true);
    setDobError(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dob }),
      });
      const json = await res.json();
      if (json.ok) {
        setDobDone(true);
        router.refresh();
      } else {
        setDobError(json.error ?? "Could not save.");
      }
    } catch {
      setDobError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {!dobDone && (
        <form
          onSubmit={saveDob}
          className="rounded-xl border border-amber/40 bg-amber/5 p-5"
        >
          <h2 className="text-sm font-semibold text-cream">Confirm your date of birth</h2>
          <p className="mt-1 text-xs text-muted leading-relaxed">
            Kleos is restricted to adults (18+). Google sign-up skips this, so we
            need it once before you can trade.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              type="date"
              value={dob}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDob(e.target.value)}
              className={`${inputCls} max-w-[220px] [color-scheme:dark]`}
              autoComplete="bday"
            />
            <button
              type="submit"
              disabled={busy || dob.length !== 10}
              className="rounded-lg bg-coral text-bg px-4 py-2 text-xs font-semibold hover:bg-coral-soft transition-colors disabled:opacity-40"
            >
              {busy ? "Saving…" : "Confirm"}
            </button>
          </div>
          {dobError && <p className="mt-2 text-xs text-loss">{dobError}</p>}
        </form>
      )}

      <div className="rounded-xl border border-line bg-panel p-5">
        <h2 className="text-sm font-semibold text-cream">
          Which creators and VIPs do you follow?
        </h2>
        <p className="mt-1 mb-4 text-xs text-muted leading-relaxed">
          Optional — this shapes your discovery feed, and your requests tell us
          who to license next. Edit any time from your profile.
        </p>
        <InterestPicker
          vips={vips}
          initialVipIds={initialVipIds}
          initialFreeText={initialFreeText}
          saveLabel="Save & continue"
          onSaved={() => {
            router.push("/");
            router.refresh();
          }}
        />
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-3 text-xs text-faint hover:text-cream transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
