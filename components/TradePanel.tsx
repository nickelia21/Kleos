"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FEE_RATE,
  MIN_SHARES,
  VIP_FEE_SHARE,
  maxSharesForBudget,
  quoteBuy,
  quoteSell,
} from "@/lib/curve";
import { fmtPct, fmtShares, fmtUsd } from "@/lib/format";
import type { CurveParams, Side } from "@/lib/types";

interface Props {
  vipId: string;
  vipName: string;
  curve: CurveParams;
  sharesOutstanding: number;
  supplySoftCap: number;
  balance: number;
  positionShares: number;
  /** Present when the trader can't trade yet (signed out / unverified /
   *  missing DOB) — the submit button becomes a link to fix it. */
  gate?: { href: string; label: string } | null;
}

interface Receipt {
  side: Side;
  shares: number;
  avgPrice: number;
  fee: number;
  total: number;
}

export function TradePanel(props: Props) {
  const router = useRouter();
  const [side, setSide] = useState<Side>("buy");
  const [sharesStr, setSharesStr] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

  const n = parseFloat(sharesStr);
  const valid = Number.isFinite(n) && n >= MIN_SHARES;

  const quote = useMemo(() => {
    if (!valid) return null;
    if (side === "sell" && n > props.positionShares + 1e-9) return null;
    return side === "buy"
      ? quoteBuy(props.curve, props.sharesOutstanding, n)
      : quoteSell(props.curve, props.sharesOutstanding, n);
  }, [valid, n, side, props.curve, props.sharesOutstanding, props.positionShares]);

  const insufficient =
    side === "buy" && quote !== null && quote.total > props.balance + 1e-9;
  const overSell = side === "sell" && valid && n > props.positionShares + 1e-9;
  const canSubmit = valid && quote !== null && !insufficient && !submitting;

  const curvePct = Math.min(
    999,
    (props.sharesOutstanding / props.supplySoftCap) * 100
  );

  function setBudget(usd: number) {
    const max = maxSharesForBudget(
      props.curve,
      props.sharesOutstanding,
      Math.min(usd, props.balance)
    );
    setSharesStr(max >= MIN_SHARES ? (Math.floor(max * 100) / 100).toString() : "");
    setReceipt(null);
    setError(null);
  }

  function setSellPct(pct: number) {
    const amt = Math.floor(props.positionShares * pct * 100) / 100;
    setSharesStr(amt >= MIN_SHARES ? amt.toString() : "");
    setReceipt(null);
    setError(null);
  }

  async function submit() {
    if (!canSubmit || !quote) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vipId: props.vipId, side, shares: n }),
      });
      const json = await res.json();
      if (json.ok) {
        setReceipt({
          side,
          shares: json.trade.shares,
          avgPrice: json.trade.avgPrice,
          fee: json.trade.fee,
          total: json.trade.total,
        });
        setSharesStr("");
        startTransition(() => router.refresh());
      } else {
        setError(json.error ?? "Trade failed.");
      }
    } catch {
      setError("Network error — trade not executed.");
    } finally {
      setSubmitting(false);
    }
  }

  const impactTone =
    quote === null
      ? ""
      : quote.impactPct >= 3
        ? "text-loss"
        : quote.impactPct >= 1
          ? "text-amber"
          : "text-muted";

  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-panel-2 p-1 mb-4">
        {(["buy", "sell"] as Side[]).map((s) => (
          <button
            key={s}
            onClick={() => {
              setSide(s);
              setReceipt(null);
              setError(null);
            }}
            className={`rounded-md py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              side === s
                ? s === "buy"
                  ? "bg-coral text-bg"
                  : "bg-cream text-bg"
                : "text-muted hover:text-cream"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <label className="block text-xs text-muted mb-1.5" htmlFor="shares">
        Shares
      </label>
      <input
        id="shares"
        type="number"
        min={MIN_SHARES}
        step="0.01"
        inputMode="decimal"
        value={sharesStr}
        onChange={(e) => {
          setSharesStr(e.target.value);
          setReceipt(null);
          setError(null);
        }}
        placeholder="0.00"
        className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm tabular text-cream placeholder:text-faint focus:border-coral focus:outline-none"
      />

      <div className="flex gap-1.5 mt-2">
        {side === "buy" ? (
          <>
            {[100, 500, 1000].map((usd) => (
              <button
                key={usd}
                onClick={() => setBudget(usd)}
                className="flex-1 rounded-md border border-line px-2 py-1 text-[11px] text-muted hover:text-cream hover:border-faint transition-colors"
              >
                ${usd >= 1000 ? `${usd / 1000}K` : usd}
              </button>
            ))}
            <button
              onClick={() => setBudget(props.balance)}
              className="flex-1 rounded-md border border-line px-2 py-1 text-[11px] text-muted hover:text-cream hover:border-faint transition-colors"
            >
              Max
            </button>
          </>
        ) : (
          [0.25, 0.5, 1].map((p) => (
            <button
              key={p}
              onClick={() => setSellPct(p)}
              disabled={props.positionShares < MIN_SHARES}
              className="flex-1 rounded-md border border-line px-2 py-1 text-[11px] text-muted hover:text-cream hover:border-faint transition-colors disabled:opacity-40"
            >
              {p === 1 ? "All" : `${p * 100}%`}
            </button>
          ))
        )}
      </div>

      <div className="mt-4 space-y-1.5 text-xs tabular">
        <Row label="Spot price" value={fmtUsd(quote?.spot ?? props.curve.basePrice + props.curve.slope * props.sharesOutstanding, 4)} />
        <Row
          label={side === "buy" ? "Your blended price" : "Your blended exit"}
          value={quote ? fmtUsd(quote.avgPrice, 4) : "—"}
        />
        <div className="flex items-center justify-between">
          <span className="text-muted">Price impact</span>
          <span className={impactTone || "text-muted"}>
            {quote ? fmtPct(quote.impactPct) : "—"}
          </span>
        </div>
        <Row label="New spot after trade" value={quote ? fmtUsd(quote.newSpot, 4) : "—"} />
        <Row
          label={`Fee (${(FEE_RATE * 100).toFixed(0)}% · ${VIP_FEE_SHARE * 100}% to VIP)`}
          value={quote ? fmtUsd(quote.fee) : "—"}
        />
        <div className="border-t border-line-soft pt-1.5 flex items-center justify-between font-semibold text-sm">
          <span>{side === "buy" ? "You pay" : "You receive"}</span>
          <span>{quote ? fmtUsd(quote.total) : "—"}</span>
        </div>
        {!props.gate && (
          <Row
            label="Balance after"
            value={
              quote
                ? fmtUsd(side === "buy" ? props.balance - quote.total : props.balance + quote.total)
                : fmtUsd(props.balance)
            }
          />
        )}
      </div>

      {insufficient && !props.gate && (
        <p className="mt-3 text-xs text-loss">Insufficient balance for this trade.</p>
      )}
      {overSell && (
        <p className="mt-3 text-xs text-loss">
          You hold {fmtShares(props.positionShares)} shares — cannot sell more.
        </p>
      )}
      {error && <p className="mt-3 text-xs text-loss">{error}</p>}

      {props.gate ? (
        <a
          href={props.gate.href}
          className="mt-4 block w-full rounded-lg bg-coral text-bg py-2.5 text-sm font-semibold text-center hover:bg-coral-soft transition-colors"
        >
          {props.gate.label}
        </a>
      ) : (
        <button
          onClick={submit}
          disabled={!canSubmit}
          className={`mt-4 w-full rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            side === "buy"
              ? "bg-coral text-bg hover:bg-coral-soft"
              : "bg-cream text-bg hover:bg-coral-soft"
          }`}
        >
          {submitting
            ? "Executing…"
            : side === "buy"
              ? `Buy ${props.vipName.split(" ")[0]} shares`
              : `Sell ${props.vipName.split(" ")[0]} shares`}
        </button>
      )}

      {receipt && (
        <div className="mt-3 rounded-lg border border-gain/40 bg-gain/10 p-3 text-xs leading-relaxed">
          <span className="font-semibold text-gain">
            {receipt.side === "buy" ? "Bought" : "Sold"} {fmtShares(receipt.shares)} shares
          </span>{" "}
          @ {fmtUsd(receipt.avgPrice, 4)} avg —{" "}
          {receipt.side === "buy" ? "total" : "net"} {fmtUsd(receipt.total)} (incl.{" "}
          {fmtUsd(receipt.fee)} fee)
        </div>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-faint border-t border-line-soft pt-3">
        <span className="text-muted font-medium">{curvePct.toFixed(0)}% of this VIP&apos;s
        curve depth is already bought.</span>{" "}
        Bonding curves price early buyers lower than late buyers — your position on the
        curve matters. Virtual USD only.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className="text-cream">{value}</span>
    </div>
  );
}
