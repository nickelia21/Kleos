import Link from "next/link";
import { Avatar } from "@/components/VipCard";
import { VIP_FEE_SHARE, FEE_RATE } from "@/lib/curve";
import { fmtUsd, fmtUsdCompact } from "@/lib/format";
import { getVips } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function VipDashboardPage() {
  const vips = [...getVips()].sort((a, b) => b.vipFeesAccrued - a.vipFeesAccrued);
  const totalVipEarnings = vips.reduce((a, v) => a + v.vipFeesAccrued, 0);

  return (
    <div>
      <p className="kicker mb-2">VIP Dashboard</p>
      <h1 className="text-2xl font-bold tracking-tight mb-2">
        Your likeness, your revenue
      </h1>
      <p className="text-sm text-muted max-w-2xl leading-relaxed mb-6">
        Every VIP on Kleos has an executed NIL license and earns{" "}
        {VIP_FEE_SHARE * 100}% of the {FEE_RATE * 100}% trading fee on their own
        index — {fmtUsd(FEE_RATE * VIP_FEE_SHARE * 100)} of every $100 traded,
        for zero marginal effort. This demo view shows all listings; in
        production each VIP sees only their own dashboard.
      </p>

      <div className="rounded-xl border border-coral/40 bg-coral/5 px-4 py-3 mb-8 text-sm tabular">
        <span className="text-muted">Total VIP earnings paid across all listings:</span>{" "}
        <span className="font-semibold text-coral">{fmtUsd(totalVipEarnings)}</span>
      </div>

      <div className="rounded-xl border border-line overflow-x-auto mb-8">
        <table className="w-full text-xs min-w-[640px]">
          <thead className="bg-panel">
            <tr className="text-left text-faint">
              <th className="px-3 py-2.5 font-medium">VIP</th>
              <th className="px-3 py-2.5 font-medium">NIL license</th>
              <th className="px-3 py-2.5 font-medium text-right">Lifetime volume</th>
              <th className="px-3 py-2.5 font-medium text-right">VIP earnings</th>
              <th className="px-3 py-2.5 font-medium text-right">Platform fees</th>
              <th className="px-3 py-2.5 font-medium text-right">Index score</th>
            </tr>
          </thead>
          <tbody>
            {vips.map((v) => (
              <tr key={v.id} className="border-t border-line-soft hover:bg-panel/60">
                <td className="px-3 py-2.5">
                  <Link href={`/vip/${v.slug}`} className="flex items-center gap-2 hover:text-coral">
                    <Avatar vip={v} size={26} />
                    <span className="font-medium">{v.name}</span>
                  </Link>
                </td>
                <td className="px-3 py-2.5">
                  <span className="text-gain">✓ Executed</span>{" "}
                  <span className="text-faint">{v.licenseExecutedAt}</span>
                </td>
                <td className="px-3 py-2.5 text-right tabular">{fmtUsdCompact(v.totalVolume)}</td>
                <td className="px-3 py-2.5 text-right tabular text-coral font-semibold">
                  {fmtUsd(v.vipFeesAccrued)}
                </td>
                <td className="px-3 py-2.5 text-right tabular text-muted">
                  {fmtUsd(v.platformFeesAccrued)}
                </td>
                <td className="px-3 py-2.5 text-right tabular">{v.indexScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-panel p-5">
          <h2 className="kicker mb-3">Post a verified update</h2>
          <textarea
            disabled
            placeholder="Verified updates are posted from the VIP's authenticated account in production. Disabled in this demo."
            className="w-full h-24 rounded-lg border border-line bg-bg px-3 py-2 text-sm placeholder:text-faint resize-none disabled:opacity-60"
          />
          <button
            disabled
            className="mt-3 rounded-lg bg-coral/40 text-bg px-4 py-2 text-xs font-semibold cursor-not-allowed"
          >
            Post update (demo disabled)
          </button>
        </div>

        <div className="rounded-xl border border-line bg-panel p-5 text-sm leading-relaxed">
          <h2 className="kicker mb-3">Trading rules for VIPs</h2>
          <p className="text-muted">
            You and anyone with advance non-public knowledge of your plans —
            management, agents, family — may not trade your index (or tip others)
            ahead of unannounced news. Material announcements must go through the
            verified updates channel so all traders see them at the same time.
            Violations terminate the NIL license and forfeit accrued revenue share.
          </p>
        </div>
      </div>
    </div>
  );
}
