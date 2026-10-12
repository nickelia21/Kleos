import type { CurveParams } from "./types";

/**
 * KLEOS BONDING CURVE — v1 (linear)
 * ---------------------------------
 * Price is a deterministic function of shares outstanding:
 *
 *    price(s) = basePrice + slope × s
 *
 * Trades execute against a per-VIP reserve pool, not a counterparty.
 * The cost of buying n shares starting from supply s is the exact
 * integral of the curve, so the reserve always fully backs the curve:
 *
 *    buyCost(s, n)  = ∫ₛ^(s+n) price(x) dx = basePrice·n + slope·(s·n + n²/2)
 *    sellProceeds(s, n) = ∫_(s−n)^s price(x) dx = basePrice·n + slope·(s·n − n²/2)
 *
 * A flat fee is charged on top of buys and out of sell proceeds and is
 * split between the platform and the VIP's NIL revenue share. The fee
 * never touches the reserve, so reserve == ∫₀^s price(x) dx at all times.
 *
 * Structural note (disclosed in the UI): bonding curves price early
 * buyers lower than late buyers. The "% of curve bought" stat exists so
 * this dynamic is visible, not implicit.
 */

export const FEE_RATE = 0.02; // flat 2% of trade value
export const VIP_FEE_SHARE = 0.5; // half of every fee goes to the VIP
export const MIN_SHARES = 0.01;

export function spotPrice(c: CurveParams, s: number): number {
  return c.basePrice + c.slope * s;
}

export function buyCost(c: CurveParams, s: number, n: number): number {
  return c.basePrice * n + c.slope * (s * n + (n * n) / 2);
}

export function sellProceeds(c: CurveParams, s: number, n: number): number {
  return c.basePrice * n + c.slope * (s * n - (n * n) / 2);
}

/** Full reserve backing supply s: ∫₀^s price(x) dx */
export function reserveAt(c: CurveParams, s: number): number {
  return c.basePrice * s + (c.slope * s * s) / 2;
}

export interface Quote {
  side: "buy" | "sell";
  shares: number;
  spot: number;
  avgPrice: number;
  /** blended vs spot, in % — the price impact of your own trade */
  impactPct: number;
  newSpot: number;
  gross: number;
  fee: number;
  /** buy: total you pay · sell: net you receive */
  total: number;
}

export function quoteBuy(c: CurveParams, s: number, n: number): Quote {
  const gross = buyCost(c, s, n);
  const fee = gross * FEE_RATE;
  const spot = spotPrice(c, s);
  const avgPrice = gross / n;
  return {
    side: "buy",
    shares: n,
    spot,
    avgPrice,
    impactPct: spot > 0 ? ((avgPrice - spot) / spot) * 100 : 0,
    newSpot: spotPrice(c, s + n),
    gross,
    fee,
    total: gross + fee,
  };
}

export function quoteSell(c: CurveParams, s: number, n: number): Quote {
  const gross = sellProceeds(c, s, n);
  const fee = gross * FEE_RATE;
  const spot = spotPrice(c, s);
  const avgPrice = gross / n;
  return {
    side: "sell",
    shares: n,
    spot,
    avgPrice,
    impactPct: spot > 0 ? ((spot - avgPrice) / spot) * 100 : 0,
    newSpot: spotPrice(c, s - n),
    gross,
    fee,
    total: gross - fee,
  };
}

/** Max whole-ish shares purchasable with a budget (solves the curve quadratic). */
export function maxSharesForBudget(
  c: CurveParams,
  s: number,
  budget: number
): number {
  const spendable = budget / (1 + FEE_RATE);
  if (spendable <= 0) return 0;
  const spot = spotPrice(c, s);
  if (c.slope === 0) return spendable / spot;
  // slope/2·n² + spot·n − spendable = 0
  const n = (-spot + Math.sqrt(spot * spot + 2 * c.slope * spendable)) / c.slope;
  return Math.max(0, n);
}
