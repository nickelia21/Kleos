import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api";
import { getDb } from "@/lib/db";
import {
  ageFromDob,
  isValidHandle,
  isValidInstagramHandle,
} from "@/lib/identifier";
import { assertSameOrigin, getRequestUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// Owner-only profile updates: display name, @handle (uniqueness-checked),
// self-reported Instagram handle, DOB (one-time, for OAuth signups that
// skipped the form), avatar data-URL.
//
// The Instagram handle is SELF-REPORTED text, format-validated only. There is
// deliberately no "Sign in with Instagram" and no Instagram API anywhere:
// Meta prohibits using Instagram as an auth method, personal accounts have no
// API access, and no Meta API exposes follow lists. See README "Why there is
// no Instagram login".

const AVATAR_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/;
const MAX_AVATAR_BYTES = 300 * 1024;

const Body = z.object({
  displayName: z.string().trim().min(2).max(60).optional(),
  handle: z.string().trim().toLowerCase().optional(),
  instagramHandle: z.string().trim().max(31).nullable().optional(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  avatarDataUrl: z.string().max(500_000).nullable().optional(),
});

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return jsonError("Invalid request.", 403);
  const user = await getRequestUser(req);
  if (!user) return jsonError("Sign in required.", 401);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid request.");
  const patch = parsed.data;

  const db = getDb();
  const sets: string[] = [];
  const args: unknown[] = [];

  if (patch.displayName !== undefined) {
    sets.push("name = ?");
    args.push(patch.displayName);
  }

  if (patch.handle !== undefined) {
    if (!isValidHandle(patch.handle)) {
      return jsonError(
        "Handles are 3–24 characters: lowercase letters, numbers, hyphens (not at the ends)."
      );
    }
    const owner = db.prepare("SELECT id FROM user WHERE handle = ?").get(patch.handle) as
      | { id: string }
      | undefined;
    if (owner && owner.id !== user.id) return jsonError("That handle is taken.", 409);
    sets.push("handle = ?");
    args.push(patch.handle);
  }

  if (patch.instagramHandle !== undefined) {
    if (patch.instagramHandle === null || patch.instagramHandle === "") {
      sets.push("instagramHandle = NULL");
    } else {
      const ig = patch.instagramHandle.replace(/^@/, "");
      if (!isValidInstagramHandle(ig)) {
        return jsonError("Instagram handles are 1–30 letters, numbers, dots or underscores.");
      }
      sets.push("instagramHandle = ?");
      args.push(ig);
    }
  }

  if (patch.dob !== undefined) {
    if (user.dob) return jsonError("Date of birth is already set.", 409);
    const age = ageFromDob(patch.dob);
    if (age === null) return jsonError("Enter a valid date of birth.");
    if (age < 18) {
      // Neutral, same as the signup gate.
      return jsonError("Kleos accounts are limited to adults.", 403);
    }
    sets.push("dob = ?");
    args.push(patch.dob);
  }

  if (patch.avatarDataUrl !== undefined) {
    if (patch.avatarDataUrl === null) {
      sets.push("image = NULL");
    } else {
      if (!AVATAR_RE.test(patch.avatarDataUrl)) {
        return jsonError("Avatar must be a PNG, JPEG or WebP image.");
      }
      const b64 = patch.avatarDataUrl.slice(patch.avatarDataUrl.indexOf(",") + 1);
      if (Buffer.from(b64, "base64").length > MAX_AVATAR_BYTES) {
        return jsonError("Avatar images are limited to 300 KB.");
      }
      sets.push("image = ?");
      args.push(patch.avatarDataUrl);
    }
  }

  if (sets.length === 0) return jsonOk();
  sets.push("updatedAt = ?");
  args.push(new Date().toISOString());
  db.prepare(`UPDATE user SET ${sets.join(", ")} WHERE id = ?`).run(...args, user.id);
  return jsonOk();
}
