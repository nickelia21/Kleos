import {
  FEE_RATE,
  MIN_SHARES,
  VIP_FEE_SHARE,
  quoteBuy,
  quoteSell,
} from "./curve";
import { getDb } from "./db";
import type { Position, Side, Trade, TraderPortfolio, Vip } from "./types";

// ---------------------------------------------------------------------------
// Market + trading data layer, SQLite-backed (lib/db.ts) and scoped by
// traderId — the anonymous single demo user is gone. Curve math is unchanged;
// every trade still executes against the per-VIP reserve inside one SQLite
// transaction so reserve == ∫₀^s price(x) dx holds at all times.
// ---------------------------------------------------------------------------

interface VipRow {
  id: string;
  slug: string;
  name: string;
  category: Vip["category"];
  tagline: string;
  bio: string;
  initials: string;
  hue: number;
  indexScore: number;
  indexSignals: string;
  basePrice: number;
  slope: number;
  sharesOutstanding: number;
  supplySoftCap: number;
  reserve: number;
  totalVolume: number;
  vipFeesAccrued: number;
  platformFeesAccrued: number;
  updates: string;
  licenseExecutedAt: string;
}

function rowToVip(row: VipRow, history: { t: number; p: number }[]): Vip {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    tagline: row.tagline,
    bio: row.bio,
    initials: row.initials,
    hue: row.hue,
    indexScore: row.indexScore,
    indexSignals: JSON.parse(row.indexSignals),
    curve: { basePrice: row.basePrice, slope: row.slope },
    sharesOutstanding: row.sharesOutstanding,
    supplySoftCap: row.supplySoftCap,
    reserve: row.reserve,
    totalVolume: row.totalVolume,
    vipFeesAccrued: row.vipFeesAccrued,
    platformFeesAccrued: row.platformFeesAccrued,
    priceHistory: history,
    updates: JSON.parse(row.updates),
    licenseExecutedAt: row.licenseExecutedAt,
  };
}

function historyFor(vipId: string): { t: number; p: number }[] {
  return getDb()
    .prepare("SELECT t, p FROM price_points WHERE vipId = ? ORDER BY t ASC")
    .all(vipId) as { t: number; p: number }[];
}

export function getVips(): Vip[] {
  const rows = getDb().prepare("SELECT * FROM vips ORDER BY rowid").all() as VipRow[];
  return rows.map((r) => rowToVip(r, historyFor(r.id)));
}

export function getVip(slug: string): Vip | undefined {
  const row = getDb().prepare("SELECT * FROM vips WHERE slug = ?").get(slug) as
    | VipRow
    | undefined;
  return row ? rowToVip(row, historyFor(row.id)) : undefined;
}

// -- Trader portfolio --------------------------------------------------------

export function getTraderPortfolio(traderId: string): TraderPortfolio {
  const db = getDb();
  const balances = db
    .prepare("SELECT balance, realizedPnl FROM user WHERE id = ?")
    .get(traderId) as { balance: number; realizedPnl: number } | undefined;
  const holdings = db
    .prepare("SELECT vipId, shares, avgCost FROM holdings WHERE traderId = ?")
    .all(traderId) as Position[];
  const watchlist = (
    db
      .prepare("SELECT vipId FROM watchlist WHERE traderId = ? ORDER BY createdAt")
      .all(traderId) as { vipId: string }[]
  ).map((r) => r.vipId);
  const trades = (
    db
      .prepare(
        `SELECT t.id, t.ts, t.vipId, v.name AS vipName, t.side, t.shares,
                t.avgPrice, t.gross, t.fee, t.total
         FROM trades t JOIN vips v ON v.id = t.vipId
         WHERE t.traderId = ? ORDER BY t.ts DESC, t.id DESC LIMIT 100`
      )
      .all(traderId) as (Omit<Trade, "id"> & { id: number })[]
  ).map((t) => ({ ...t, id: `t${t.id}` }));

  return {
    balance: balances?.balance ?? 0,
    realizedPnl: balances?.realizedPnl ?? 0,
    positions: Object.fromEntries(holdings.map((h) => [h.vipId, h])),
    watchlist,
    trades,
  };
}

export function getPositionShares(traderId: string, vipId: string): number {
  const row = getDb()
    .prepare("SELECT shares FROM holdings WHERE traderId = ? AND vipId = ?")
    .get(traderId, vipId) as { shares: number } | undefined;
  return row?.shares ?? 0;
}

// -- Trading ------------------------------------------------------------------

export type TradeResult =
  | { ok: true; trade: Trade; newSpot: number; balance: number }
  | { ok: false; error: string };

export function executeTrade(
  traderId: string,
  vipId: string,
  side: Side,
  sharesRaw: number
): TradeResult {
  const db = getDb();
  const n = Math.round(sharesRaw * 100) / 100;
  if (!Number.isFinite(n) || n < MIN_SHARES)
    return { ok: false, error: `Minimum trade size is ${MIN_SHARES} shares.` };

  let result: TradeResult = { ok: false, error: "Trade failed." };
  db.transaction(() => {
    const vip = db.prepare("SELECT * FROM vips WHERE id = ?").get(vipId) as
      | VipRow
      | undefined;
    if (!vip) {
      result = { ok: false, error: "Unknown VIP." };
      return;
    }
    const trader = db
      .prepare("SELECT balance, realizedPnl FROM user WHERE id = ?")
      .get(traderId) as { balance: number; realizedPnl: number } | undefined;
    if (!trader) {
      result = { ok: false, error: "Unknown trader." };
      return;
    }
    const curve = { basePrice: vip.basePrice, slope: vip.slope };
    const pos = db
      .prepare("SELECT shares, avgCost FROM holdings WHERE traderId = ? AND vipId = ?")
      .get(traderId, vipId) as { shares: number; avgCost: number } | undefined;

    let quote;
    let newBalance = trader.balance;
    let newRealized = trader.realizedPnl;

    if (side === "buy") {
      quote = quoteBuy(curve, vip.sharesOutstanding, n);
      if (quote.total > trader.balance + 1e-9) {
        result = { ok: false, error: "Insufficient balance for this trade." };
        return;
      }
      newBalance -= quote.total;
      const oldShares = pos?.shares ?? 0;
      const oldAvg = pos?.avgCost ?? 0;
      const newShares = oldShares + n;
      db.prepare(
        `INSERT INTO holdings (traderId, vipId, shares, avgCost) VALUES (?, ?, ?, ?)
         ON CONFLICT(traderId, vipId) DO UPDATE SET shares = excluded.shares, avgCost = excluded.avgCost`
      ).run(traderId, vipId, newShares, (oldShares * oldAvg + quote.total) / newShares);
    } else {
      if (!pos || pos.shares < n - 1e-9) {
        result = {
          ok: false,
          error: `You hold ${pos ? pos.shares.toFixed(2) : "0"} shares — not enough to sell ${n}.`,
        };
        return;
      }
      quote = quoteSell(curve, vip.sharesOutstanding, n);
      newBalance += quote.total;
      newRealized += quote.total - pos.avgCost * n;
      const remaining = pos.shares - n;
      if (remaining < 1e-6) {
        db.prepare("DELETE FROM holdings WHERE traderId = ? AND vipId = ?").run(
          traderId,
          vipId
        );
      } else {
        db.prepare(
          "UPDATE holdings SET shares = ? WHERE traderId = ? AND vipId = ?"
        ).run(remaining, traderId, vipId);
      }
    }

    const dir = side === "buy" ? 1 : -1;
    db.prepare(
      `UPDATE vips SET sharesOutstanding = sharesOutstanding + ?,
        reserve = reserve + ?, totalVolume = totalVolume + ?,
        vipFeesAccrued = vipFeesAccrued + ?, platformFeesAccrued = platformFeesAccrued + ?
       WHERE id = ?`
    ).run(
      dir * n,
      dir * quote.gross,
      quote.gross,
      quote.fee * VIP_FEE_SHARE,
      quote.fee * (1 - VIP_FEE_SHARE),
      vipId
    );
    const now = Date.now();
    db.prepare("INSERT INTO price_points (vipId, t, p) VALUES (?, ?, ?)").run(
      vipId,
      now,
      quote.newSpot
    );
    db.prepare("UPDATE user SET balance = ?, realizedPnl = ? WHERE id = ?").run(
      newBalance,
      newRealized,
      traderId
    );
    const inserted = db
      .prepare(
        `INSERT INTO trades (ts, traderId, vipId, side, shares, avgPrice, gross, fee, total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(now, traderId, vipId, side, n, quote.avgPrice, quote.gross, quote.fee, quote.total);

    result = {
      ok: true,
      trade: {
        id: `t${inserted.lastInsertRowid}`,
        ts: now,
        vipId,
        vipName: vip.name,
        side,
        shares: n,
        avgPrice: quote.avgPrice,
        gross: quote.gross,
        fee: quote.fee,
        total: quote.total,
      },
      newSpot: quote.newSpot,
      balance: newBalance,
    };
  })();
  return result;
}

// -- Watchlist (writes interest rows so the recruiting signal stays current) --

export function toggleWatch(traderId: string, vipId: string): { watching: boolean } {
  const db = getDb();
  const exists = db
    .prepare("SELECT 1 FROM watchlist WHERE traderId = ? AND vipId = ?")
    .get(traderId, vipId);
  if (exists) {
    db.transaction(() => {
      db.prepare("DELETE FROM watchlist WHERE traderId = ? AND vipId = ?").run(
        traderId,
        vipId
      );
      db.prepare(
        "DELETE FROM trader_interests WHERE traderId = ? AND vipId = ? AND source = 'watchlist'"
      ).run(traderId, vipId);
    })();
    return { watching: false };
  }
  db.transaction(() => {
    db.prepare(
      "INSERT INTO watchlist (traderId, vipId, createdAt) VALUES (?, ?, ?)"
    ).run(traderId, vipId, Date.now());
    db.prepare(
      `INSERT INTO trader_interests (traderId, vipId, source, createdAt)
       VALUES (?, ?, 'watchlist', ?)`
    ).run(traderId, vipId, Date.now());
  })();
  return { watching: true };
}

export { FEE_RATE, VIP_FEE_SHARE };
