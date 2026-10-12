import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { buildSeedVips } from "./seed";

// ---------------------------------------------------------------------------
// SQLite data layer. One file DB under data/ (gitignored). The handle lives on
// globalThis so it survives HMR in dev. Migrations run idempotently on open;
// VIP seed data is inserted only when the market tables are empty, so market
// state now persists across restarts (unlike the old in-memory store).
//
// The `user`, `session`, `account`, `verification` and `rateLimit` tables
// follow better-auth's schema (camelCase columns) — better-auth reads/writes
// them through its adapter, we only touch them directly where noted.
// ---------------------------------------------------------------------------

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "kleos.db");

const MIGRATIONS: { id: number; sql: string }[] = [
  {
    id: 1, // better-auth core + phone-number plugin + Kleos trader fields
    sql: `
      CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        emailVerified INTEGER NOT NULL DEFAULT 0,
        image TEXT,
        createdAt DATE NOT NULL,
        updatedAt DATE NOT NULL,
        -- phone-number plugin
        phoneNumber TEXT UNIQUE,
        phoneNumberVerified INTEGER,
        -- Kleos trader fields (user.additionalFields in lib/auth.ts)
        handle TEXT UNIQUE,
        dob TEXT,
        instagramHandle TEXT,
        deletedAt DATE,
        balance REAL NOT NULL DEFAULT 10000,
        realizedPnl REAL NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS session (
        id TEXT PRIMARY KEY,
        expiresAt DATE NOT NULL,
        token TEXT NOT NULL UNIQUE,
        createdAt DATE NOT NULL,
        updatedAt DATE NOT NULL,
        ipAddress TEXT,
        userAgent TEXT,
        userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS account (
        id TEXT PRIMARY KEY,
        accountId TEXT NOT NULL,
        providerId TEXT NOT NULL,
        userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
        accessToken TEXT,
        refreshToken TEXT,
        idToken TEXT,
        accessTokenExpiresAt DATE,
        refreshTokenExpiresAt DATE,
        scope TEXT,
        password TEXT,
        createdAt DATE NOT NULL,
        updatedAt DATE NOT NULL
      );
      CREATE TABLE IF NOT EXISTS verification (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expiresAt DATE NOT NULL,
        createdAt DATE,
        updatedAt DATE
      );
      CREATE TABLE IF NOT EXISTS rateLimit (
        id TEXT PRIMARY KEY,
        key TEXT,
        count INTEGER,
        lastRequest INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_session_userId ON session(userId);
      CREATE INDEX IF NOT EXISTS idx_account_userId ON account(userId);
      CREATE INDEX IF NOT EXISTS idx_verification_identifier ON verification(identifier);
    `,
  },
  {
    id: 2, // market + trader-scoped trading tables
    sql: `
      CREATE TABLE IF NOT EXISTS vips (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        tagline TEXT NOT NULL,
        bio TEXT NOT NULL,
        initials TEXT NOT NULL,
        hue INTEGER NOT NULL,
        indexScore INTEGER NOT NULL,
        indexSignals TEXT NOT NULL,      -- JSON IndexSignal[]
        basePrice REAL NOT NULL,
        slope REAL NOT NULL,
        sharesOutstanding REAL NOT NULL,
        supplySoftCap REAL NOT NULL,
        reserve REAL NOT NULL,
        totalVolume REAL NOT NULL,
        vipFeesAccrued REAL NOT NULL,
        platformFeesAccrued REAL NOT NULL,
        updates TEXT NOT NULL,           -- JSON VipUpdate[]
        licenseExecutedAt TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS price_points (
        vipId TEXT NOT NULL REFERENCES vips(id) ON DELETE CASCADE,
        t INTEGER NOT NULL,
        p REAL NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_price_points ON price_points(vipId, t);
      CREATE TABLE IF NOT EXISTS trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts INTEGER NOT NULL,
        traderId TEXT NOT NULL REFERENCES user(id),
        vipId TEXT NOT NULL REFERENCES vips(id),
        side TEXT NOT NULL CHECK (side IN ('buy','sell')),
        shares REAL NOT NULL,
        avgPrice REAL NOT NULL,
        gross REAL NOT NULL,
        fee REAL NOT NULL,
        total REAL NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_trades_trader ON trades(traderId, ts DESC);
      CREATE TABLE IF NOT EXISTS holdings (
        traderId TEXT NOT NULL REFERENCES user(id),
        vipId TEXT NOT NULL REFERENCES vips(id),
        shares REAL NOT NULL,
        avgCost REAL NOT NULL,
        PRIMARY KEY (traderId, vipId)
      );
      CREATE TABLE IF NOT EXISTS watchlist (
        traderId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
        vipId TEXT NOT NULL REFERENCES vips(id),
        createdAt INTEGER NOT NULL,
        PRIMARY KEY (traderId, vipId)
      );
      -- Interest signal per SPEC: onboarding picks, free-text creator requests
      -- ("who should we bring to Kleos?"), and watchlist activity. Free-text
      -- rows with vipId NULL feed the /admin/recruiting pipeline.
      CREATE TABLE IF NOT EXISTS trader_interests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        traderId TEXT NOT NULL REFERENCES user(id),
        vipId TEXT REFERENCES vips(id),
        freeTextName TEXT,
        source TEXT NOT NULL CHECK (source IN ('onboarding_pick','free_text_request','watchlist')),
        createdAt INTEGER NOT NULL,
        CHECK (vipId IS NOT NULL OR freeTextName IS NOT NULL)
      );
      CREATE INDEX IF NOT EXISTS idx_interests_trader ON trader_interests(traderId);
      CREATE INDEX IF NOT EXISTS idx_interests_freetext ON trader_interests(freeTextName) WHERE freeTextName IS NOT NULL;
      -- Failed-login / OTP-send tracking for per-identifier lockout.
      -- Identifiers are stored as SHA-256 hashes — no emails/phones in this
      -- table, per the no-PII-at-rest-outside-user-rows baseline.
      CREATE TABLE IF NOT EXISTS auth_throttle (
        idHash TEXT NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('login','otp','forgot')),
        ts INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_auth_throttle ON auth_throttle(idHash, kind, ts);
    `,
  },
];

function migrate(db: Database.Database) {
  db.exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations (id INTEGER PRIMARY KEY, appliedAt INTEGER NOT NULL)"
  );
  const applied = new Set(
    (db.prepare("SELECT id FROM schema_migrations").all() as { id: number }[]).map((r) => r.id)
  );
  const mark = db.prepare("INSERT INTO schema_migrations (id, appliedAt) VALUES (?, ?)");
  for (const m of MIGRATIONS) {
    if (applied.has(m.id)) continue;
    db.transaction(() => {
      db.exec(m.sql);
      mark.run(m.id, Date.now());
    })();
  }
}

function seedIfEmpty(db: Database.Database) {
  const count = (db.prepare("SELECT COUNT(*) AS n FROM vips").get() as { n: number }).n;
  if (count > 0) return;
  const vips = buildSeedVips(Date.now());
  const insertVip = db.prepare(`
    INSERT INTO vips (id, slug, name, category, tagline, bio, initials, hue,
      indexScore, indexSignals, basePrice, slope, sharesOutstanding,
      supplySoftCap, reserve, totalVolume, vipFeesAccrued, platformFeesAccrued,
      updates, licenseExecutedAt)
    VALUES (@id, @slug, @name, @category, @tagline, @bio, @initials, @hue,
      @indexScore, @indexSignals, @basePrice, @slope, @sharesOutstanding,
      @supplySoftCap, @reserve, @totalVolume, @vipFeesAccrued, @platformFeesAccrued,
      @updates, @licenseExecutedAt)
  `);
  const insertPoint = db.prepare(
    "INSERT INTO price_points (vipId, t, p) VALUES (?, ?, ?)"
  );
  db.transaction(() => {
    for (const v of vips) {
      insertVip.run({
        id: v.id,
        slug: v.slug,
        name: v.name,
        category: v.category,
        tagline: v.tagline,
        bio: v.bio,
        initials: v.initials,
        hue: v.hue,
        indexScore: v.indexScore,
        indexSignals: JSON.stringify(v.indexSignals),
        basePrice: v.curve.basePrice,
        slope: v.curve.slope,
        sharesOutstanding: v.sharesOutstanding,
        supplySoftCap: v.supplySoftCap,
        reserve: v.reserve,
        totalVolume: v.totalVolume,
        vipFeesAccrued: v.vipFeesAccrued,
        platformFeesAccrued: v.platformFeesAccrued,
        updates: JSON.stringify(v.updates),
        licenseExecutedAt: v.licenseExecutedAt,
      });
      for (const p of v.priceHistory) insertPoint.run(v.id, p.t, p.p);
    }
  })();
}

function open(): Database.Database {
  fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  seedIfEmpty(db);
  return db;
}

const g = globalThis as unknown as { __kleosDb?: Database.Database };

export function getDb(): Database.Database {
  if (!g.__kleosDb) g.__kleosDb = open();
  return g.__kleosDb;
}
