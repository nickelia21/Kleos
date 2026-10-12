export type Category =
  | "music"
  | "film-tv"
  | "sports"
  | "creators"
  | "reality-tv";

export const CATEGORY_ORDER: Category[] = [
  "music",
  "film-tv",
  "sports",
  "creators",
  "reality-tv",
];

export const CATEGORY_LABELS: Record<Category, string> = {
  music: "Music & Artists",
  "film-tv": "Film/TV & Actors",
  sports: "Sports",
  creators: "Creators & Influencers",
  "reality-tv": "Reality TV",
};

export interface CurveParams {
  /** Price of the very first share, in virtual USD. */
  basePrice: number;
  /** Price increase per share outstanding (linear curve). */
  slope: number;
}

export interface IndexSignal {
  label: string;
  source: string; // named public data source — methodology must be auditable
  weight: number; // % weight in the Interest Index
  value: string; // display value, e.g. "8.4M monthly listeners"
}

export interface VipUpdate {
  id: string;
  ts: number;
  body: string;
}

export interface PricePoint {
  t: number;
  p: number;
}

export interface Vip {
  id: string;
  slug: string;
  name: string;
  category: Category;
  tagline: string;
  bio: string;
  initials: string;
  /** warm hue (deg) for the avatar tint */
  hue: number;
  indexScore: number; // 0–100 Interest Index reference metric
  indexSignals: IndexSignal[];
  curve: CurveParams;
  sharesOutstanding: number;
  /** Reference curve depth used for the "% of curve bought" disclosure. */
  supplySoftCap: number;
  /** Reserve pool (virtual USD) — always equals the curve integral over sharesOutstanding. */
  reserve: number;
  totalVolume: number;
  vipFeesAccrued: number;
  platformFeesAccrued: number;
  priceHistory: PricePoint[];
  updates: VipUpdate[];
  licenseExecutedAt: string; // ISO date — no listing without an executed NIL license
}

export type Side = "buy" | "sell";

export interface Position {
  vipId: string;
  shares: number;
  /** Average cost per share including fees paid. */
  avgCost: number;
}

export interface Trade {
  id: string;
  ts: number;
  vipId: string;
  vipName: string;
  side: Side;
  shares: number;
  avgPrice: number;
  gross: number;
  fee: number;
  /** Buy: total paid (gross + fee). Sell: net received (gross − fee). */
  total: number;
}

export interface TraderPortfolio {
  balance: number; // virtual USD
  positions: Record<string, Position>;
  watchlist: string[];
  trades: Trade[];
  realizedPnl: number;
}
