import Link from "next/link";
import { spotPrice } from "@/lib/curve";
import { fmtPct, fmtUsd } from "@/lib/format";
import type { Vip } from "@/lib/types";
import { Sparkline } from "./Sparkline";

export function change24h(vip: Vip): number {
  const h = vip.priceHistory;
  if (h.length < 2) return 0;
  const now = h[h.length - 1];
  const dayAgo =
    [...h].reverse().find((p) => p.t <= now.t - 86_400_000) ?? h[0];
  return dayAgo.p > 0 ? ((now.p - dayAgo.p) / dayAgo.p) * 100 : 0;
}

export function Avatar({ vip, size = 40 }: { vip: Vip; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center font-serif-brand shrink-0 select-none"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        fontSize: Math.round(size * 0.38),
        background: `hsl(${vip.hue} 42% 20%)`,
        color: `hsl(${vip.hue} 72% 72%)`,
      }}
    >
      {vip.initials}
    </span>
  );
}

export function VipCard({ vip }: { vip: Vip }) {
  const price = spotPrice(vip.curve, vip.sharesOutstanding);
  const chg = change24h(vip);
  const curvePct = (vip.sharesOutstanding / vip.supplySoftCap) * 100;

  return (
    <Link
      href={`/vip/${vip.slug}`}
      className="block rounded-xl border border-line bg-panel p-4 hover:border-faint transition-colors"
    >
      <div className="flex items-start gap-3">
        <Avatar vip={vip} />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm truncate">{vip.name}</div>
          <div className="text-xs text-muted truncate mt-0.5">{vip.tagline}</div>
        </div>
        <Sparkline points={vip.priceHistory.slice(-30)} width={72} height={28} />
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="text-lg font-semibold tabular">{fmtUsd(price)}</div>
          <div
            className={`text-xs tabular ${chg >= 0 ? "text-gain" : "text-loss"}`}
          >
            {fmtPct(chg)} · 24h
          </div>
        </div>
        <div className="text-right text-[11px] text-faint leading-relaxed">
          <div>
            Index <span className="text-muted">{vip.indexScore}</span>
          </div>
          <div>
            Curve bought <span className="text-muted">{curvePct.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
