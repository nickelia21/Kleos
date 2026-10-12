"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { inputCls } from "@/components/auth/AuthCard";

export function DangerZone() {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<"none" | "signout" | "delete">("none");

  async function signOutEverywhere() {
    setBusy("signout");
    setError(null);
    await authClient.revokeSessions(); // all sessions, this one included
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (confirmText !== "DELETE" || busy !== "none") return;
    setBusy("delete");
    setError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Could not delete the account.");
        setBusy("none");
        return;
      }
      setNotice("Account deleted.");
      await authClient.signOut().catch(() => {});
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error — nothing deleted.");
      setBusy("none");
    }
  }

  return (
    <section className="rounded-xl border border-loss/30 bg-panel p-5">
      <h2 className="kicker mb-4 text-loss">Danger zone</h2>

      <button
        onClick={signOutEverywhere}
        disabled={busy !== "none"}
        className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-muted hover:text-cream hover:border-faint transition-colors disabled:opacity-50"
      >
        {busy === "signout" ? "Signing out…" : "Sign out of all sessions"}
      </button>
      <p className="mt-1.5 text-[11px] text-faint">
        Ends every active session on every device, including this one.
      </p>

      <form onSubmit={deleteAccount} className="mt-5 border-t border-line-soft pt-4">
        <p className="text-xs text-muted leading-relaxed mb-2">
          Deleting your account removes all sign-in methods, sessions, watchlist
          and interests, and anonymizes your profile. Trade history is kept
          anonymized so market reserves and curve math stay intact. Type{" "}
          <span className="text-cream font-semibold">DELETE</span> to confirm.
        </p>
        <div className="flex gap-2">
          <input
            className={`${inputCls} max-w-[160px]`}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            aria-label="Type DELETE to confirm"
          />
          <button
            type="submit"
            disabled={confirmText !== "DELETE" || busy !== "none"}
            className="rounded-lg bg-loss/90 text-bg px-4 py-2 text-xs font-semibold hover:bg-loss transition-colors disabled:opacity-40"
          >
            {busy === "delete" ? "Deleting…" : "Delete account"}
          </button>
        </div>
      </form>

      {error && <p className="mt-3 text-xs text-loss">{error}</p>}
      {notice && <p className="mt-3 text-xs text-gain">{notice}</p>}
    </section>
  );
}
