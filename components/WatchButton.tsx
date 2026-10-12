"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function WatchButton({
  vipId,
  watching: initial,
  signedIn,
}: {
  vipId: string;
  watching: boolean;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [watching, setWatching] = useState(initial);
  const [pending, startTransition] = useTransition();

  async function toggle() {
    if (!signedIn) {
      router.push("/login");
      return;
    }
    const res = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vipId }),
    });
    const json = await res.json();
    if (json.ok) {
      setWatching(json.watching);
      startTransition(() => router.refresh());
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      title={signedIn ? undefined : "Sign in to build a watchlist"}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
        watching
          ? "border-coral text-coral bg-coral/10"
          : "border-line text-muted hover:text-cream hover:border-faint"
      }`}
      aria-pressed={watching}
    >
      {watching ? "★ Watching" : "☆ Watch"}
    </button>
  );
}
