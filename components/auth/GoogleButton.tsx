"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

// "Continue with Google". With real keys this uses better-auth's Google
// provider; without them it goes through the clearly-labeled local dev mock
// (same "google" providerId, so linked accounts are identical either way).

export function GoogleButton({
  mode,
  intent = "signin",
  callbackURL = "/",
  label = "Continue with Google",
}: {
  mode: "real" | "mock";
  intent?: "signin" | "link";
  callbackURL?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    try {
      const res =
        intent === "signin"
          ? mode === "real"
            ? await authClient.signIn.social({ provider: "google", callbackURL })
            : await authClient.signIn.oauth2({ providerId: "google", callbackURL })
          : mode === "real"
            ? await authClient.linkSocial({ provider: "google", callbackURL })
            : await authClient.oauth2.link({ providerId: "google", callbackURL });
      if (res?.error) {
        setError(res.error.message ?? "Google sign-in failed.");
        setBusy(false);
      }
      // On success the browser is redirected to the provider.
    } catch {
      setError("Google sign-in failed.");
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-sm font-medium text-cream hover:border-faint transition-colors disabled:opacity-50"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.17 3.57-8.81z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.93-2.91l-3.87-3c-1.07.72-2.44 1.14-4.06 1.14-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A11.99 11.99 0 0 0 12 24z" />
          <path fill="#FBBC05" d="M5.29 14.28A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.56.38-2.28v-3.1H1.29A11.99 11.99 0 0 0 0 12c0 1.94.46 3.77 1.29 5.38l4-3.1z" />
          <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.23 0 12 0 7.31 0 3.26 2.69 1.29 6.62l4 3.1C6.23 6.88 8.88 4.77 12 4.77z" />
        </svg>
        {busy ? "Redirecting…" : label}
        {mode === "mock" && (
          <span className="rounded border border-amber/50 bg-amber/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber">
            dev mock
          </span>
        )}
      </button>
      {error && <p className="mt-2 text-xs text-loss">{error}</p>}
    </div>
  );
}
