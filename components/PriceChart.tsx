import { fmtDate, fmtUsd } from "@/lib/format";
import type { PricePoint } from "@/lib/types";

/** Server-rendered SVG price chart driven by the VIP's actual curve history. */
export function PriceChart({ points }: { points: PricePoint[] }) {
  const W = 680;
  const H = 240;
  const PAD_L = 52;
  const PAD_R = 14;
  const PAD_T = 12;
  const PAD_B = 26;

  if (points.length < 2) return null;

  const ps = points.map((p) => p.p);
  const ts = points.map((p) => p.t);
  const minP = Math.min(...ps);
  const maxP = Math.max(...ps);
  const padP = (maxP - minP) * 0.08 || maxP * 0.05 || 1;
  const lo = Math.max(0, minP - padP);
  const hi = maxP + padP;
  const t0 = ts[0];
  const t1 = ts[ts.length - 1];
  const tRange = t1 - t0 || 1;

  const x = (t: number) => PAD_L + ((t - t0) / tRange) * (W - PAD_L - PAD_R);
  const y = (p: number) => PAD_T + (1 - (p - lo) / (hi - lo)) * (H - PAD_T - PAD_B);

  const line = points
    .map((pt, i) => `${i === 0 ? "M" : "L"}${x(pt.t).toFixed(1)},${y(pt.p).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(t1).toFixed(1)},${H - PAD_B} L${PAD_L},${H - PAD_B} Z`;

  const gridLevels = [lo + (hi - lo) * 0.25, lo + (hi - lo) * 0.5, lo + (hi - lo) * 0.75];
  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Price history chart">
      <defs>
        <linearGradient id="kleos-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-coral)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--color-coral)" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {gridLevels.map((g, i) => (
        <g key={i}>
          <line
            x1={PAD_L}
            x2={W - PAD_R}
            y1={y(g)}
            y2={y(g)}
            stroke="var(--color-line-soft)"
            strokeDasharray="3 5"
            strokeWidth="1"
          />
          <text x={PAD_L - 8} y={y(g) + 3} textAnchor="end" fontSize="10" fill="var(--color-faint)">
            {fmtUsd(g)}
          </text>
        </g>
      ))}

      <path d={area} fill="url(#kleos-area)" />
      <path d={line} fill="none" stroke="var(--color-coral)" strokeWidth="2" strokeLinejoin="round" />
      <circle cx={x(last.t)} cy={y(last.p)} r="3.5" fill="var(--color-coral)" />
      <circle cx={x(last.t)} cy={y(last.p)} r="7" fill="var(--color-coral)" opacity="0.25" />

      <text x={PAD_L} y={H - 8} fontSize="10" fill="var(--color-faint)">
        {fmtDate(t0)}
      </text>
      <text x={W - PAD_R} y={H - 8} textAnchor="end" fontSize="10" fill="var(--color-faint)">
        {fmtDate(t1)}
      </text>
    </svg>
  );
}
