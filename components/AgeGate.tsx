"use client";

import { useEffect, useState } from "react";
import { KBadge, Wordmark } from "./Brand";

const KEY = "kleos-age-attested";

export function AgeGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* storage unavailable — fail open for the demo */
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <KBadge size={36} />
          <Wordmark className="text-lg" />
        </div>
        <h1 className="text-lg font-semibold mb-3">18+ only</h1>
        <p className="text-sm text-muted leading-relaxed mb-4">
          Kleos is restricted to adults. In production, access is also
          geofenced to permitted jurisdictions and identity-verified — this
          demo simulates that gate.
        </p>
        <p className="text-xs text-faint leading-relaxed mb-6">
          This prototype uses virtual USD only. No real money, no deposits, no
          withdrawals. All VIPs shown are fictional.
        </p>
        <button
          onClick={() => {
            try {
              window.localStorage.setItem(KEY, "1");
            } catch {}
            setShow(false);
          }}
          className="w-full rounded-lg bg-coral text-bg font-semibold py-2.5 text-sm hover:bg-coral-soft transition-colors"
        >
          I am 18 or older — enter
        </button>
      </div>
    </div>
  );
}
