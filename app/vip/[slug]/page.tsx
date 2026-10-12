import Link from "next/link";
import { notFound } from "next/navigation";
import { PriceChart } from "@/components/PriceChart";
import { TradePanel } from "@/components/TradePanel";
import { Avatar, change24h } from "@/components/VipCard";
import { WatchButton } from "@/components/WatchButton";
import { spotPrice } from "@/lib/curve";
import { fmtDate, fmtPct, fmtShares, fmtUsd, fmtUsdCompact } from "@/lib/format";
import { getPositionShares, getVip } from "@/lib/store";
import {
  getSessionUser,
  hasVerifiedContact,
  isAdult,
} from "@/lib/session";
import { getDb } from "@/lib/db";
import { CATEGORY_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function VipPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vip = getVip(slug);
  if (!vip) notFound();

  const user = await getSessionUser();
  const price = spotPrice(vip.curve, vip.sharesOutstanding);
  const chg = change24h(vip);
  const curvePct = (vip.sharesOutstanding / vip.supplySoftCap) * 100;
  const positionShares = user ? getPositionShares(user.id, vip.id) : 0;
  const watching = user
    ? !!getDb()
        .prepare("SELECT 1 FROM watchlist WHERE traderId = ? AND vipId = ?")
        .get(user.id, vip.id)
    : false;

  // Trade gating mirrors /api/trade: session → verified contact → 18+ DOB.
  const gate = !user
    ? { href: "/login", label: "Log in to trade" }
    : !hasVerifiedContact(user)
      ? {
          href:
            user.phoneNumber && !user.phoneNumberVerified
              ? "/verify-phone"
              : "/verify-email",
          label: "Verify to trade",
        }
      : !isAdult(user)
        ? { href: "/onboarding", label: "Confirm your age to trade" }
        : null;

  return (
    <div>
      <div className="flex flex-wrap items-start gap-4 mb-6">
        <Avatar vip={vip} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">{vip.name}</h1>
            <span className="rounded-md border border-line px-2 py-0.5 text-[11px] text-muted">
              {CATEGORY_LABELS[vip.category]}
            </span>
            <span
              className="rounded-md border border-gain/40 bg-gain/10 px-2 py-0.5 text-[11px] text-gain"
              title="No VIP can be listed without an executed name-image-likeness license."
            >
              NIL license · executed {vip.licenseExecutedAt}
            </span>
          </div>
          <p className="text-sm text-muted mt-1">{vip.tagline}</p>
        </div>
        <WatchButton vipId={vip.id} watching={watching} signedIn={!!user} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6 min-w-0">
          <div className="rounded-xl border border-line bg-panel p-5">
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-bold tabular">{fmtUsd(price)}</span>
              <span className={`text-sm tabular ${chg >= 0 ? "text-gain" : "text-loss"}`}>
                {fmtPct(chg)} · 24h
              </span>
              {positionShares > 0 && (
                <span className="ml-auto text-xs text-muted tabular">
                  You hold {fmtShares(positionShares)} shares
                </span>
              )}
            </div>
            <PriceChart points={vip.priceHistory} />
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <Stat label="Reserve pool" value={fmtUsdCompact(vip.reserve)} />
              <Stat label="Lifetime volume" value={fmtUsdCompact(vip.totalVolume)} />
              <Stat label="Shares outstanding" value={fmtShares(vip.sharesOutstanding)} />
              <Stat label="Curve bought" value={`${curvePct.toFixed(1)}%`} />
            </div>
          </div>

          <div className="rounded-xl border border-line bg-panel p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="kicker">Interest Index</h2>
              <span className="text-2xl font-bold tabular text-coral">
                {vip.indexScore}
                <span className="text-xs text-faint font-normal"> / 100</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-panel-2 mb-4 overflow-hidden">
              <div
                className="h-full rounded-full bg-coral"
                style={{ width: `${vip.indexScore}%` }}
              />
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-faint">
                  <th className="font-medium pb-2">Signal</th>
                  <th className="font-medium pb-2">Source</th>
                  <th className="font-medium pb-2 text-right">Weight</th>
                  <th className="font-medium pb-2 text-right">Latest</th>
                </tr>
              </thead>
              <tbody>
                {vip.indexSignals.map((s) => (
                  <tr key={s.label} className="border-t border-line-soft">
                    <td className="py-2 text-cream">{s.label}</td>
                    <td className="py-2 text-muted">{s.source}</td>
                    <td className="py-2 text-right text-muted tabular">{s.weight}%</td>
                    <td className="py-2 text-right text-cream tabular">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-[11px] leading-relaxed text-faint">
              The index is a published reference metric built only from public,
              professional signals — never personal-life data. Trades execute on
              the bonding curve, not the index.{" "}
              <Link href="/methodology" className="text-muted underline hover:text-cream">
                Full methodology
              </Link>
            </p>
          </div>

          <div className="rounded-xl border border-line bg-panel p-5">
            <h2 className="kicker mb-3">Verified VIP updates</h2>
            <div className="space-y-4">
              {vip.updates.map((u) => (
                <div key={u.id} className="border-l-2 border-coral/60 pl-3">
                  <div className="text-[11px] text-faint mb-1">
                    <span className="text-coral font-medium">✓ Verified</span> ·{" "}
                    {fmtDate(u.ts)}
                  </div>
                  <p className="text-sm leading-relaxed text-cream">{u.body}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-faint border-t border-line-soft pt-3">
              Updates are posted by the VIP or their verified representative.
              VIPs and anyone with advance non-public knowledge of their plans
              are prohibited from trading ahead of announcements.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-panel p-5">
            <h2 className="kicker mb-3">About</h2>
            <p className="text-sm leading-relaxed text-muted">{vip.bio}</p>
            <p className="mt-3 text-[11px] text-faint">
              Fictional VIP for demo purposes — no real person is listed in this prototype.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <TradePanel
            vipId={vip.id}
            vipName={vip.name}
            curve={vip.curve}
            sharesOutstanding={vip.sharesOutstanding}
            supplySoftCap={vip.supplySoftCap}
            balance={user?.balance ?? 0}
            positionShares={positionShares}
            gate={gate}
          />
          <div className="rounded-xl border border-line bg-panel p-4 text-[11px] leading-relaxed text-faint">
            <p className="kicker mb-2 text-muted">This market&apos;s curve</p>
            <p className="tabular text-muted">
              price = {fmtUsd(vip.curve.basePrice)} + {vip.curve.slope} × shares
            </p>
            <p className="mt-2">
              Deterministic and published — the platform has no discretion over
              price. The reserve pool always equals the curve integral, so every
              share can be sold back to the curve at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-panel-2 px-3 py-2">
      <div className="text-faint">{label}</div>
      <div className="text-cream font-semibold tabular mt-0.5">{value}</div>
    </div>
  );
}
