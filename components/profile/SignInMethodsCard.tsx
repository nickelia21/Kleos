"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import type { PasswordCheck } from "@/lib/password-policy";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { PasswordMeter } from "@/components/auth/PasswordMeter";
import { inputCls, labelCls } from "@/components/auth/AuthCard";

// Linked sign-in methods. One trader can hold several identities (password,
// Google); the last remaining method can't be removed — enforced here for UX
// and by better-auth server-side.

export interface Identity {
  id: string;
  providerId: string; // "credential" | "google"
  createdAt: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  credential: "Password",
  google: "Google",
};

export function SignInMethodsCard({
  identities,
  googleMode,
  userInputs,
}: {
  identities: Identity[];
  googleMode: "real" | "mock";
  userInputs: string[];
}) {
  const router = useRouter();
  const hasPassword = identities.some((i) => i.providerId === "credential");
  const hasGoogle = identities.some((i) => i.providerId === "google");
  const [panel, setPanel] = useState<"none" | "add" | "change">("none");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // add-password state
  const [newPw, setNewPw] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [check, setCheck] = useState<PasswordCheck | null>(null);
  const [busy, setBusy] = useState(false);

  async function unlink(identity: Identity) {
    setError(null);
    setNotice(null);
    if (identities.length <= 1) return;
    if (!window.confirm(`Remove ${PROVIDER_LABELS[identity.providerId] ?? identity.providerId} sign-in from this account?`)) {
      return;
    }
    const res = await authClient.unlinkAccount({
      providerId: identity.providerId,
      accountId: identity.id,
    });
    if (res.error) {
      setError(res.error.message ?? "Could not remove that sign-in method.");
    } else {
      setNotice("Sign-in method removed.");
      router.refresh();
    }
  }

  async function addPassword(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !check?.ok) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: newPw }),
      });
      const json = await res.json();
      if (json.ok) {
        setNotice("Password added — you can now sign in either way.");
        setPanel("none");
        setNewPw("");
        router.refresh();
      } else {
        setError(json.error ?? "Could not add a password.");
      }
    } catch {
      setError("Network error — nothing saved.");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !check?.ok || !currentPw) return;
    setBusy(true);
    setError(null);
    const res = await authClient.changePassword({
      currentPassword: currentPw,
      newPassword: newPw,
      revokeOtherSessions: true,
    });
    if (res.error) {
      setError(
        res.error.status === 400 && res.error.message
          ? res.error.message
          : "Current password is incorrect."
      );
    } else {
      setNotice("Password changed. Other sessions were signed out.");
      setPanel("none");
      setNewPw("");
      setCurrentPw("");
    }
    setBusy(false);
  }

  return (
    <section className="rounded-xl border border-line bg-panel p-5">
      <h2 className="kicker mb-4">Sign-in methods</h2>

      <div className="space-y-2">
        {identities.map((identity) => (
          <div
            key={identity.id}
            className="flex items-center gap-3 rounded-lg border border-line-soft bg-panel-2 px-3 py-2.5"
          >
            <span className="text-sm font-medium text-cream">
              {PROVIDER_LABELS[identity.providerId] ?? identity.providerId}
            </span>
            {identity.providerId === "google" && googleMode === "mock" && (
              <span className="rounded border border-amber/50 bg-amber/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber">
                dev mock
              </span>
            )}
            <span className="ml-auto text-[11px] text-faint">Added {identity.createdAt}</span>
            <button
              onClick={() => unlink(identity)}
              disabled={identities.length <= 1}
              title={
                identities.length <= 1
                  ? "You must keep at least one sign-in method."
                  : undefined
              }
              className="text-[11px] text-muted hover:text-loss transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-muted"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!hasPassword && (
          <button
            onClick={() => {
              setPanel(panel === "add" ? "none" : "add");
              setError(null);
            }}
            className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-muted hover:text-cream hover:border-faint transition-colors"
          >
            Add a password
          </button>
        )}
        {hasPassword && (
          <button
            onClick={() => {
              setPanel(panel === "change" ? "none" : "change");
              setError(null);
            }}
            className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-muted hover:text-cream hover:border-faint transition-colors"
          >
            Change password
          </button>
        )}
      </div>

      {!hasGoogle && (
        <div className="mt-3">
          <GoogleButton
            mode={googleMode}
            intent="link"
            callbackURL="/profile"
            label="Link Google account"
          />
        </div>
      )}

      {panel === "add" && (
        <form onSubmit={addPassword} className="mt-4 rounded-lg border border-line-soft bg-panel-2 p-4">
          <label className={labelCls} htmlFor="ap-pw">
            New password
          </label>
          <input
            id="ap-pw"
            className={inputCls}
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            maxLength={128}
            autoComplete="new-password"
          />
          <PasswordMeter password={newPw} userInputs={userInputs} onCheck={setCheck} />
          <button
            type="submit"
            disabled={busy || !check?.ok}
            className="mt-3 rounded-lg bg-coral text-bg px-4 py-2 text-xs font-semibold hover:bg-coral-soft transition-colors disabled:opacity-40"
          >
            {busy ? "Adding…" : "Add password"}
          </button>
        </form>
      )}

      {panel === "change" && (
        <form onSubmit={changePassword} className="mt-4 rounded-lg border border-line-soft bg-panel-2 p-4">
          <label className={labelCls} htmlFor="cp-cur">
            Current password
          </label>
          <input
            id="cp-cur"
            className={inputCls}
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            autoComplete="current-password"
          />
          <label className={labelCls} htmlFor="cp-new">
            New password
          </label>
          <input
            id="cp-new"
            className={inputCls}
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            maxLength={128}
            autoComplete="new-password"
          />
          <PasswordMeter password={newPw} userInputs={userInputs} onCheck={setCheck} />
          <button
            type="submit"
            disabled={busy || !check?.ok || !currentPw}
            className="mt-3 rounded-lg bg-coral text-bg px-4 py-2 text-xs font-semibold hover:bg-coral-soft transition-colors disabled:opacity-40"
          >
            {busy ? "Changing…" : "Change password"}
          </button>
        </form>
      )}

      {error && <p className="mt-3 text-xs text-loss">{error}</p>}
      {notice && <p className="mt-3 text-xs text-gain">{notice}</p>}
      <p className="mt-4 text-[11px] leading-relaxed text-faint border-t border-line-soft pt-3">
        You must always keep at least one working sign-in method. Linking by
        verified email match is automatic — sign in with Google using the same
        address and it attaches to this account.
      </p>
    </section>
  );
}
