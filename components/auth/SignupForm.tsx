"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PasswordCheck } from "@/lib/password-policy";
import { Divider, inputCls, labelCls, primaryBtnCls } from "./AuthCard";
import { GoogleButton } from "./GoogleButton";
import { PasswordMeter } from "./PasswordMeter";

const todayIso = () => new Date().toISOString().slice(0, 10);

export function SignupForm({ googleMode }: { googleMode: "real" | "mock" }) {
  const router = useRouter();
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [displayName, setDisplayName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [dob, setDob] = useState("");
  const [password, setPassword] = useState("");
  const [check, setCheck] = useState<PasswordCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ready =
    displayName.trim().length >= 2 &&
    identifier.trim().length > 0 &&
    dob.length === 10 &&
    !!check?.ok &&
    !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          identifier: identifier.trim(),
          displayName: displayName.trim(),
          dob,
          password,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        router.push(json.next ?? "/");
        router.refresh();
      } else {
        setError(json.error ?? "Sign up failed.");
        setBusy(false);
      }
    } catch {
      setError("Network error — please try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-panel-2 p-1 mb-4">
        {(["email", "phone"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setIdentifier("");
              setError(null);
            }}
            className={`rounded-md py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              mode === m ? "bg-coral text-bg" : "text-muted hover:text-cream"
            }`}
          >
            {m === "email" ? "Email" : "Phone"}
          </button>
        ))}
      </div>

      <label className={labelCls} htmlFor="su-name">
        Display name
      </label>
      <input
        id="su-name"
        className={inputCls}
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        maxLength={60}
        placeholder="How other traders see you"
        autoComplete="name"
      />

      <label className={labelCls} htmlFor="su-id">
        {mode === "email" ? "Email" : "Phone number"}
      </label>
      <input
        id="su-id"
        className={inputCls}
        type={mode === "email" ? "email" : "tel"}
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        placeholder={mode === "email" ? "you@example.com" : "+1 555 123 4567"}
        autoComplete={mode === "email" ? "email" : "tel"}
      />
      <p className="mt-1.5 text-[11px] text-faint">
        {mode === "email"
          ? "You'll get a verification link — required before your first trade."
          : "You'll get a 6-digit code by SMS — required before your first trade."}
      </p>

      <label className={labelCls} htmlFor="su-dob">
        Date of birth <span className="text-faint">· Kleos is 18+</span>
      </label>
      <input
        id="su-dob"
        className={`${inputCls} [color-scheme:dark]`}
        type="date"
        value={dob}
        max={todayIso()}
        onChange={(e) => setDob(e.target.value)}
        autoComplete="bday"
      />

      <label className={labelCls} htmlFor="su-pw">
        Password
      </label>
      <input
        id="su-pw"
        className={inputCls}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        maxLength={128}
        placeholder="At least 12 characters"
        autoComplete="new-password"
      />
      <PasswordMeter
        password={password}
        userInputs={[displayName, identifier]}
        onCheck={setCheck}
      />

      {error && <p className="mt-3 text-xs text-loss">{error}</p>}

      <button type="submit" disabled={!ready} className={primaryBtnCls}>
        {busy ? "Creating account…" : "Create account"}
      </button>

      <Divider />
      <GoogleButton mode={googleMode} callbackURL="/onboarding" />

      <p className="mt-5 text-center text-xs text-muted">
        Already trading here?{" "}
        <Link href="/login" className="text-coral hover:text-coral-soft">
          Log in
        </Link>
      </p>
    </form>
  );
}
