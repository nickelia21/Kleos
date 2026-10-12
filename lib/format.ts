// Deterministic formatters (no locale APIs) — identical output on server
// and client, so nothing here can cause hydration mismatches.

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function group(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function fmtUsd(v: number, dp = 2): string {
  if (!Number.isFinite(v)) return "—";
  const neg = v < -1e-9;
  const s = Math.abs(v).toFixed(dp);
  const [i, f] = s.split(".");
  return `${neg ? "−" : ""}$${group(i)}${f ? "." + f : ""}`;
}

export function fmtUsdCompact(v: number): string {
  const a = Math.abs(v);
  if (a >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (a >= 1e4) return `$${(v / 1e3).toFixed(1)}K`;
  return fmtUsd(v);
}

export function fmtShares(v: number): string {
  const s = v.toFixed(2).replace(/\.00$/, "");
  const [i, f] = s.split(".");
  return `${group(i)}${f ? "." + f : ""}`;
}

export function fmtPct(v: number, dp = 2): string {
  if (!Number.isFinite(v)) return "—";
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  return `${sign}${Math.abs(v).toFixed(dp)}%`;
}

/** better-auth may hand back Date objects, ISO strings or epoch ms depending
 *  on the read path — normalize to epoch ms for the formatters below. */
export function parseDbDate(v: unknown): number {
  if (typeof v === "number") return v;
  if (v instanceof Date) return v.getTime();
  const t = Date.parse(String(v));
  return Number.isNaN(t) ? 0 : t;
}

export function fmtDate(ts: number): string {
  const d = new Date(ts);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function fmtDateTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getUTCHours().toString().padStart(2, "0");
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  return `${fmtDate(ts)} · ${h}:${m} UTC`;
}
