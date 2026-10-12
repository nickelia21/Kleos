"use client";

import { useMemo, useState } from "react";

// "Which creators and VIPs do you follow?" — searchable multi-select over the
// seeded VIP list plus free-text requests for people not yet on Kleos. This
// is the consent-clean alternative to mining Instagram follow graphs (which
// Meta neither permits nor exposes — see README "Why there is no Instagram
// login"). Used by onboarding and the profile page.

export interface PickableVip {
  id: string;
  name: string;
  category: string;
  tagline: string;
}

export function InterestPicker({
  vips,
  initialVipIds,
  initialFreeText,
  onSaved,
  saveLabel = "Save",
}: {
  vips: PickableVip[];
  initialVipIds: string[];
  initialFreeText: string[];
  onSaved?: () => void;
  saveLabel?: string;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(initialVipIds));
  const [freeText, setFreeText] = useState<string[]>(initialFreeText);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vips;
    return vips.filter(
      (v) => v.name.toLowerCase().includes(q) || v.tagline.toLowerCase().includes(q)
    );
  }, [vips, query]);

  function toggle(id: string) {
    setSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addFreeText() {
    const name = draft.replace(/\s+/g, " ").trim();
    if (name.length < 2 || freeText.length >= 20) return;
    if (freeText.some((f) => f.toLowerCase() === name.toLowerCase())) {
      setDraft("");
      return;
    }
    setFreeText((prev) => [...prev, name]);
    setDraft("");
    setSaved(false);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vipIds: [...selected], freeText }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Could not save.");
        return;
      }
      setSaved(true);
      onSaved?.();
    } catch {
      setError("Network error — nothing saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search VIPs on Kleos…"
        className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-cream placeholder:text-faint focus:border-coral focus:outline-none"
      />
      <div className="mt-3 grid gap-2 sm:grid-cols-2 max-h-72 overflow-y-auto pr-1">
        {filtered.map((v) => {
          const on = selected.has(v.id);
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => toggle(v.id)}
              aria-pressed={on}
              className={`text-left rounded-xl border px-3 py-2.5 transition-colors ${
                on
                  ? "border-coral bg-coral/10"
                  : "border-line bg-panel hover:border-faint"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${on ? "text-coral" : "text-cream"}`}>
                  {on ? "✓ " : ""}
                  {v.name}
                </span>
              </div>
              <div className="text-[11px] text-faint truncate mt-0.5">{v.tagline}</div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-xs text-faint py-4 sm:col-span-2">
            No VIPs match “{query}” — add them below and we&apos;ll work on it.
          </p>
        )}
      </div>

      <div className="mt-5">
        <p className="text-xs font-medium text-cream mb-1.5">
          Who should we bring to Kleos?
        </p>
        <p className="text-[11px] text-faint mb-2">
          Creators you follow who aren&apos;t listed yet. Every request feeds our
          licensing outreach — VIPs only ever join by signing an NIL deal.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFreeText();
              }
            }}
            maxLength={80}
            placeholder="Name or handle, e.g. “Mika Reyes”"
            className="flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-cream placeholder:text-faint focus:border-coral focus:outline-none"
          />
          <button
            type="button"
            onClick={addFreeText}
            className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-muted hover:text-cream hover:border-faint transition-colors"
          >
            Add
          </button>
        </div>
        {freeText.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {freeText.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel-2 px-2 py-1 text-xs text-cream"
              >
                {name}
                <button
                  type="button"
                  aria-label={`Remove ${name}`}
                  onClick={() => {
                    setFreeText((prev) => prev.filter((f) => f !== name));
                    setSaved(false);
                  }}
                  className="text-faint hover:text-loss"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-xs text-loss">{error}</p>}
      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="rounded-lg bg-coral text-bg px-5 py-2 text-sm font-semibold hover:bg-coral-soft transition-colors disabled:opacity-50"
        >
          {busy ? "Saving…" : saveLabel}
        </button>
        {saved && <span className="text-xs text-gain">Saved.</span>}
      </div>
    </div>
  );
}
