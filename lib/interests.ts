import { getDb } from "./db";

// "Which creators and VIPs do you follow?" — the consent-clean substitute for
// Instagram-graph mining (see README: Meta prohibits Instagram login and
// exposes no follow lists, so Kleos asks instead of scraping). Rows come from
// onboarding picks, free-text creator requests, and watchlist activity.

export type InterestSource = "onboarding_pick" | "free_text_request" | "watchlist";

export interface TraderInterest {
  id: number;
  vipId: string | null;
  freeTextName: string | null;
  source: InterestSource;
  createdAt: number;
}

export function getInterests(traderId: string): TraderInterest[] {
  return getDb()
    .prepare(
      `SELECT id, vipId, freeTextName, source, createdAt
       FROM trader_interests WHERE traderId = ? ORDER BY createdAt ASC, id ASC`
    )
    .all(traderId) as TraderInterest[];
}

function cleanFreeText(name: string): string | null {
  const cleaned = name.replace(/\s+/g, " ").trim().slice(0, 80);
  return cleaned.length >= 2 ? cleaned : null;
}

/** Replace the trader's onboarding picks + free-text requests (watchlist
 *  rows are managed by toggleWatch and left untouched). */
export function setPickedInterests(
  traderId: string,
  vipIds: string[],
  freeText: string[]
) {
  const db = getDb();
  const validVip = db.prepare("SELECT 1 FROM vips WHERE id = ?");
  const seen = new Set<string>();
  const cleanedText = freeText
    .map(cleanFreeText)
    .filter((v): v is string => v !== null)
    .filter((v) => {
      const key = v.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 20);
  const cleanedVips = [...new Set(vipIds)].filter((id) => validVip.get(id)).slice(0, 50);

  db.transaction(() => {
    db.prepare(
      `DELETE FROM trader_interests
       WHERE traderId = ? AND source IN ('onboarding_pick','free_text_request')`
    ).run(traderId);
    const now = Date.now();
    const insert = db.prepare(
      `INSERT INTO trader_interests (traderId, vipId, freeTextName, source, createdAt)
       VALUES (?, ?, ?, ?, ?)`
    );
    for (const vipId of cleanedVips) insert.run(traderId, vipId, null, "onboarding_pick", now);
    for (const name of cleanedText) insert.run(traderId, null, name, "free_text_request", now);
  })();
}

export interface RecruitingRow {
  name: string;
  requests: number;
  firstRequested: number;
  lastRequested: number;
}

/** VIP recruiting pipeline: most-requested creators not yet listed, by
 *  distinct requesting traders. Powers /admin/recruiting. */
export function recruitingPipeline(): RecruitingRow[] {
  return getDb()
    .prepare(
      `SELECT MIN(freeTextName) AS name,
              COUNT(DISTINCT traderId) AS requests,
              MIN(createdAt) AS firstRequested,
              MAX(createdAt) AS lastRequested
       FROM trader_interests
       WHERE source = 'free_text_request' AND freeTextName IS NOT NULL
       GROUP BY LOWER(freeTextName)
       ORDER BY requests DESC, lastRequested DESC`
    )
    .all() as RecruitingRow[];
}
