"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { inputCls } from "@/components/auth/AuthCard";

// Self-reported Instagram handle — text field only, format-validated.
// There is intentionally NO "Sign in with Instagram" and no Instagram API
// call anywhere in Kleos: Meta prohibits Instagram as an auth method,
// personal accounts have no API access, and follow lists aren't exposed by
// any Meta API. Interests are collected by asking (see the onboarding
// picker) instead of scraping. Details in README "Why there is no Instagram
// login" — please don't "helpfully" add it.

export function InstagramCard({ instagramHandle }: { instagramHandle: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(instagramHandle ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instagramHandle: value.trim() || null }),
      });
      const json = await res.json();
      if (json.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(json.error ?? "Could not save.");
      }
    } catch {
      setError("Network error — nothing saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-line bg-panel p-5">
      <div className="flex items-center gap-2 mb-1.5">
        <h2 className="kicker">Instagram handle</h2>
        <span className="rounded border border-line px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-faint">
          Optional
        </span>
      </div>
      <p className="text-[11px] text-faint leading-relaxed mb-3">
        Self-reported, shown nowhere publicly in this prototype. Kleos never
        connects to Instagram — no login, no API, no follow-list access.
      </p>
      <form onSubmit={save} className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-faint">@</span>
          <input
            className={`${inputCls} pl-7`}
            value={value}
            maxLength={31}
            placeholder="yourhandle"
            onChange={(e) => {
              setValue(e.target.value.replace(/^@/, ""));
              setSaved(false);
            }}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-muted hover:text-cream hover:border-faint transition-colors disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-loss">{error}</p>}
      {saved && <p className="mt-2 text-xs text-gain">Saved.</p>}
    </section>
  );
}
