"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Divider, inputCls, labelCls, primaryBtnCls } from "./AuthCard";
import { GoogleButton } from "./GoogleButton";

export function LoginForm({ googleMode }: { googleMode: "real" | "mock" }) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !identifier.trim() || !password) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const json = await res.json();
      if (json.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(json.error ?? "Invalid credentials.");
        setBusy(false);
      }
    } catch {
      setError("Network error — please try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <label className={labelCls} htmlFor="li-id">
        Email or phone number
      </label>
      <input
        id="li-id"
        className={inputCls}
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        placeholder="you@example.com · +1 555 123 4567"
        autoComplete="username"
      />

      <div className="flex items-baseline justify-between mt-4 mb-1.5">
        <label className="text-xs text-muted" htmlFor="li-pw">
          Password
        </label>
        <Link
          href="/forgot-password"
          className="text-[11px] text-faint hover:text-cream transition-colors"
        >
          Forgot password?
        </Link>
      </div>
      <input
        id="li-pw"
        className={inputCls}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
      />

      {error && <p className="mt-3 text-xs text-loss">{error}</p>}

      <button
        type="submit"
        disabled={busy || !identifier.trim() || !password}
        className={primaryBtnCls}
      >
        {busy ? "Signing in…" : "Log in"}
      </button>

      <Divider />
      <GoogleButton mode={googleMode} callbackURL="/" />

      <p className="mt-5 text-center text-xs text-muted">
        New here?{" "}
        <Link href="/signup" className="text-coral hover:text-coral-soft">
          Create an account
        </Link>
      </p>
    </form>
  );
}
