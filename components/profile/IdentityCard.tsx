"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TraderAvatar } from "@/components/TraderAvatar";
import { inputCls, labelCls } from "@/components/auth/AuthCard";

// Public-ish identity: display name, unique @handle (live availability
// check), avatar upload with initials fallback.

const MAX_AVATAR_BYTES = 300 * 1024;

async function fileToAvatarDataUrl(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
  if (raw.length <= MAX_AVATAR_BYTES * 1.34) return raw; // base64 overhead ≈ 4/3
  // Downscale big photos to a 256px square-ish thumb.
  const img = document.createElement("img");
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = raw;
  });
  const scale = 256 / Math.max(img.width, img.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * Math.min(1, scale)));
  canvas.height = Math.max(1, Math.round(img.height * Math.min(1, scale)));
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function IdentityCard({
  name,
  handle,
  image,
  joined,
}: {
  name: string;
  handle: string;
  image: string | null;
  joined: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(name);
  const [handleDraft, setHandleDraft] = useState(handle);
  const [availability, setAvailability] = useState<"unknown" | "checking" | "ok" | "taken" | "invalid">("ok");
  const [avatar, setAvatar] = useState<string | null | undefined>(undefined); // undefined = unchanged
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const next = handleDraft.trim().toLowerCase();
    if (next === handle) {
      setAvailability("ok");
      return;
    }
    setAvailability("checking");
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/account/handle-check?handle=${encodeURIComponent(next)}`);
        const json = await res.json();
        setAvailability(!json.valid ? "invalid" : json.available ? "ok" : "taken");
      } catch {
        setAvailability("unknown");
      }
    }, 350);
    return () => clearTimeout(t);
  }, [handleDraft, handle]);

  async function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Avatar must be a PNG, JPEG or WebP image.");
      return;
    }
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      if (dataUrl.length > MAX_AVATAR_BYTES * 1.34) {
        setError("That image is too large even after resizing — try a smaller one.");
        return;
      }
      setError(null);
      setSaved(false);
      setAvatar(dataUrl);
    } catch {
      setError("Could not read that image.");
    }
  }

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    const body: Record<string, unknown> = {};
    if (displayName.trim() !== name) body.displayName = displayName.trim();
    if (handleDraft.trim().toLowerCase() !== handle) body.handle = handleDraft.trim().toLowerCase();
    if (avatar !== undefined) body.avatarDataUrl = avatar;
    if (Object.keys(body).length === 0) {
      setBusy(false);
      setSaved(true);
      return;
    }
    try {
      const res = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.ok) {
        setSaved(true);
        setAvatar(undefined);
        router.refresh();
      } else {
        setError(json.error ?? "Could not save.");
      }
    } catch {
      setError("Network error — nothing saved.");
    } finally {
      setBusy(false);
    }
  }

  const previewImage = avatar === undefined ? image : avatar;
  const canSave =
    !busy &&
    displayName.trim().length >= 2 &&
    (availability === "ok" || handleDraft.trim().toLowerCase() === handle);

  return (
    <section className="rounded-xl border border-line bg-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="kicker">Identity</h2>
        <span className="text-[11px] text-faint">Joined {joined}</span>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center gap-2">
          <TraderAvatar name={displayName || name} image={previewImage} size={64} />
          <label className="cursor-pointer text-[11px] text-muted hover:text-cream transition-colors">
            Upload
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={pickAvatar}
            />
          </label>
          {previewImage && (
            <button
              type="button"
              onClick={() => {
                setAvatar(null);
                setSaved(false);
              }}
              className="text-[11px] text-faint hover:text-loss transition-colors"
            >
              Remove
            </button>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <label className={labelCls} htmlFor="pi-name">
            Display name
          </label>
          <input
            id="pi-name"
            className={inputCls}
            value={displayName}
            maxLength={60}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setSaved(false);
            }}
          />

          <label className={labelCls} htmlFor="pi-handle">
            Trader handle
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-faint">@</span>
            <input
              id="pi-handle"
              className={`${inputCls} pl-7`}
              value={handleDraft}
              maxLength={24}
              onChange={(e) => {
                setHandleDraft(e.target.value.toLowerCase());
                setSaved(false);
              }}
            />
          </div>
          <p className="mt-1 text-[11px]">
            {availability === "checking" && <span className="text-faint">Checking…</span>}
            {availability === "taken" && <span className="text-loss">That handle is taken.</span>}
            {availability === "invalid" && (
              <span className="text-loss">
                3–24 chars: lowercase letters, numbers, hyphens (not at the ends).
              </span>
            )}
            {availability === "ok" && handleDraft.trim().toLowerCase() !== handle && (
              <span className="text-gain">Available.</span>
            )}
            {availability === "ok" && handleDraft.trim().toLowerCase() === handle && (
              <Link
                href={`/trader/${handle}`}
                className="text-faint hover:text-cream transition-colors"
              >
                Public profile: kleos/trader/{handle} →
              </Link>
            )}
          </p>
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-loss">{error}</p>}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={!canSave}
          className="rounded-lg bg-coral text-bg px-4 py-2 text-xs font-semibold hover:bg-coral-soft transition-colors disabled:opacity-40"
        >
          {busy ? "Saving…" : "Save identity"}
        </button>
        {saved && <span className="text-xs text-gain">Saved.</span>}
      </div>
    </section>
  );
}
