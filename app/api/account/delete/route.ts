import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api";
import { getDb } from "@/lib/db";
import { assertSameOrigin, getRequestUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// Soft delete: the trader row is kept but anonymized (trades/holdings keep
// their traderId so per-VIP reserve, volume and curve math stay intact —
// per spec, trade rows are anonymized, never hard-deleted). All sign-in
// identities, sessions, watchlist entries and interest rows are removed;
// the identifiers are freed for future signups.

const Body = z.object({ confirm: z.literal("DELETE") });

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return jsonError("Invalid request.", 403);
  const user = await getRequestUser(req);
  if (!user) return jsonError("Sign in required.", 401);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError('Type "DELETE" to confirm.');

  const db = getDb();
  // Full user id keeps the anonymized handle/email unique (both columns are UNIQUE).
  const suffix = user.id.toLowerCase();
  db.transaction(() => {
    db.prepare(
      `UPDATE user SET
         deletedAt = ?, updatedAt = ?,
         name = 'Deleted Trader',
         handle = ?,
         email = ?,
         emailVerified = 0,
         phoneNumber = NULL,
         phoneNumberVerified = 0,
         image = NULL,
         instagramHandle = NULL,
         dob = NULL
       WHERE id = ?`
    ).run(
      new Date().toISOString(),
      new Date().toISOString(),
      `deleted-${suffix}`,
      `deleted-${user.id}@deleted.kleos.invalid`,
      user.id
    );
    db.prepare("DELETE FROM account WHERE userId = ?").run(user.id);
    db.prepare("DELETE FROM session WHERE userId = ?").run(user.id);
    db.prepare("DELETE FROM watchlist WHERE traderId = ?").run(user.id);
    db.prepare("DELETE FROM trader_interests WHERE traderId = ?").run(user.id);
  })();
  return jsonOk();
}
