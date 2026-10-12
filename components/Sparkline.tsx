import type { PricePoint } from "@/lib/types";

export function Sparkline({
  points,
  width = 96,
  height = 32,
}: {
  points: PricePoint[];
  width?: number;
  height?: number;
}) {
  if (points.length < 2) return null;
  const ps = points.map((pt) => pt.p);
  const min = Math.min(...ps);
  const max = Math.max(...ps);
  const range = max - min || 1;
  const step = width / (ps.length - 1);
  const d = ps
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(
          height - 3 - ((p - min) / range) * (height - 6)
        ).toFixed(1)}`
    )
    .join(" ");
  const up = ps[ps.length - 1] >= ps[0];
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden
      className="shrink-0"
    >
      <path
        d={d}
        fill="none"
        stroke={up ? "var(--color-gain)" : "var(--color-loss)"}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
