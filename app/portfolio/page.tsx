import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar, change24h } from "@/components/VipCard";
import { quoteSell, spotPrice } from "@/lib/curve";
import { fmtDateTime, fmtPct, fmtShares, fmtUsd } from "@/lib/format";
import { getSessionUser } from "@/lib/session";
import { getTraderPortfolio, getVips } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");
  const user = getTraderPortfolio(sessionUser.id);
  const vips = getVips();
  const byId = new Map(vips.map((v) => [v.id, v]));

  const positions = Object.values(user.positions)
    .map((pos) => {
      const vip = byId.get(pos.vipId)!;
      const spot = spotPrice(vip.curve, vip.sharesOutstanding);
      const value = pos.shares * spot;
      const exit = quoteSell(vip.curve, vip.sharesOutstanding, pos.shares).total;
      const cost = pos.shares * pos.avgCost;
      return { pos, vip, spot, value, exit, pnl: value - cost, pnlPct: cost > 0 ? ((value - cost) / cost) * 100 : 0 };
    })
    .sort((a, b) => b.value - a.value);

  const totalValue = positions.reduce((a, p) => a + p.value, 0);
  const totalPnl = positions.reduce((a, p) => a + p.pnl, 0);
  const watched = vips.filter((v) => user.watchlist.includes(v.id));

  return (
    <div>
      <p className="kicker mb-2">Portfolio</p>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Your positions</h1>

      <div className="grid gap-3 sm:grid-cols-4 mb-8">
        <Summary label="Cash balance" value={fmtUsd(user.balance)} />
        <Summary label="Positions value (spot)" value={fmtUsd(totalValue)} />
        <Summary
          label="Unrealized P/L"
          value={fmtUsd(totalPnl)}
          tone={totalPnl >= 0 ? "gain" : "loss"}
        />
        <Summary
          label="Realized P/L"
          value={fmtUsd(user.realizedPnl)}
          tone={user.realizedPnl >= 0 ? "gain" : "loss"}
        />
      </div>

      <section className="mb-10">
        <h2 className="kicker mb-3">Holdings</h2>
        {positions.length === 0 ? (
          <Empty text="No positions yet. Browse the markets and make your first trade — you start with $10,000 in virtual USD." cta="Browse VIPs" href="/" />
        ) : (
          <div className="rounded-xl border border-line overflow-x-auto">
            <table className="w-full text-xs min-w-[640px]">
              <thead className="bg-panel">
                <tr className="text-left text-faint">
                  <Th>VIP</Th>
                  <Th right>Shares</Th>
                  <Th right>Avg cost</Th>
                  <Th right>Spot</Th>
                  <Th right>Value (spot)</Th>
                  <Th right>Exit est.*</Th>
                  <Th right>P/L</Th>
                </tr>
              </thead>
              <tbody>
                {positions.map(({ pos, vip, spot, value, exit, pnl, pnlPct }) => (
                  <tr key={pos.vipId} className="border-t border-line-soft hover:bg-panel/60">
                    <td className="px-3 py-2.5">
                      <Link href={`/vip/${vip.slug}`} className="flex items-center gap-2 hover:text-coral">
                        <Avatar vip={vip} size={26} />
                        <span className="font-medium">{vip.name}</span>
                      </Link>
                    </td>
                    <Td>{fmtShares(pos.shares)}</Td>
                    <Td>{fmtUsd(pos.avgCost, 4)}</Td>
                    <Td>{fmtUsd(spot, 4)}</Td>
                    <Td>{fmtUsd(value)}</Td>
                    <Td>{fmtUsd(exit)}</Td>
                    <td className={`px-3 py-2.5 text-right tabular ${pnl >= 0 ? "text-gain" : "text-loss"}`}>
                      {fmtUsd(pnl)} ({fmtPct(pnlPct)})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {positions.length > 0 && (
          <p className="mt-2 text-[11px] text-faint leading-relaxed">
            *Exit est. is what you&apos;d actually receive selling your full position
            back to the curve right now, after price impact and the 2% fee — an honest
            number that will be lower than spot × shares.
          </p>
        )}
      </section>

      <section className="mb-10">
        <h2 className="kicker mb-3">Watchlist</h2>
        {watched.length === 0 ? (
          <Empty text="Nothing on your watchlist. Star a VIP from their market page." cta="Browse VIPs" href="/" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {watched.map((vip) => {
              const price = spotPrice(vip.curve, vip.sharesOutstanding);
              const chg = change24h(vip);
              return (
                <Link
                  key={vip.id}
                  href={`/vip/${vip.slug}`}
                  className="flex items-center gap-3 rounded-xl border border-line bg-panel p-3 hover:border-faint transition-colors"
                >
                  <Avatar vip={vip} size={32} />
                  <span className="text-sm font-medium flex-1 truncate">{vip.name}</span>
                  <span className="text-sm tabular">{fmtUsd(price)}</span>
                  <span className={`text-xs tabular ${chg >= 0 ? "text-gain" : "text-loss"}`}>
                    {fmtPct(chg)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="kicker mb-3">Trade history</h2>
        {user.trades.length === 0 ? (
          <Empty text="No trades yet." cta="Browse VIPs" href="/" />
        ) : (
          <div className="rounded-xl border border-line overflow-x-auto">
            <table className="w-full text-xs min-w-[560px]">
              <thead className="bg-panel">
                <tr className="text-left text-faint">
                  <Th>Time</Th>
                  <Th>VIP</Th>
                  <Th>Side</Th>
                  <Th right>Shares</Th>
                  <Th right>Avg price</Th>
                  <Th right>Fee</Th>
                  <Th right>Total</Th>
                </tr>
              </thead>
              <tbody>
                {user.trades.slice(0, 30).map((t) => (
                  <tr key={t.id} className="border-t border-line-soft">
                    <td className="px-3 py-2 text-faint whitespace-nowrap">{fmtDateTime(t.ts)}</td>
                    <td className="px-3 py-2 font-medium">{t.vipName}</td>
                    <td className={`px-3 py-2 uppercase text-[10px] font-bold tracking-wider ${t.side === "buy" ? "text-coral" : "text-cream"}`}>
                      {t.side}
                    </td>
                    <Td>{fmtShares(t.shares)}</Td>
                    <Td>{fmtUsd(t.avgPrice, 4)}</Td>
                    <Td>{fmtUsd(t.fee)}</Td>
                    <Td>{fmtUsd(t.total)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Summary({ label, value, tone }: { label: string; value: string; tone?: "gain" | "loss" }) {
  return (
    <div className="rounded-xl border border-line bg-panel px-4 py-3">
      <div className="text-[11px] text-faint">{label}</div>
      <div className={`text-lg font-semibold tabular mt-0.5 ${tone === "gain" ? "text-gain" : tone === "loss" ? "text-loss" : "text-cream"}`}>
        {value}
      </div>
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`px-3 py-2.5 font-medium ${right ? "text-right" : ""}`}>{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2.5 text-right tabular">{children}</td>;
}

function Empty({ text, cta, href }: { text: string; cta: string; href: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-panel/40 p-8 text-center">
      <p className="text-sm text-muted mb-3">{text}</p>
      <Link
        href={href}
        className="inline-block rounded-lg bg-coral text-bg px-4 py-2 text-xs font-semibold hover:bg-coral-soft transition-colors"
      >
        {cta}
      </Link>
    </div>
  );
}
