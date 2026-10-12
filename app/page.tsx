import { VipCard } from "@/components/VipCard";
import { fmtUsdCompact } from "@/lib/format";
import { getVips } from "@/lib/store";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function DiscoveryPage() {
  const vips = getVips();
  const totalVolume = vips.reduce((a, v) => a + v.totalVolume, 0);
  const totalReserve = vips.reduce((a, v) => a + v.reserve, 0);

  return (
    <div>
      <div className="mb-8">
        <p className="kicker mb-2">Markets</p>
        <h1 className="text-2xl font-bold tracking-tight">
          Trade the people the world is watching
        </h1>
        <p className="text-sm text-muted mt-2 max-w-2xl leading-relaxed">
          Every VIP here has signed an NIL license and earns a share of trading
          fees on their own index. Prices move along a published bonding curve —
          buys push up, sells push down, every trade clears against the reserve.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-faint tabular">
          <span>
            <span className="text-muted font-medium">{vips.length}</span> listed VIPs
          </span>
          <span>
            <span className="text-muted font-medium">{fmtUsdCompact(totalVolume)}</span> lifetime volume
          </span>
          <span>
            <span className="text-muted font-medium">{fmtUsdCompact(totalReserve)}</span> in reserves
          </span>
          <span className="text-faint">Virtual USD · demo</span>
        </div>
      </div>

      {CATEGORY_ORDER.map((cat) => {
        const group = vips.filter((v) => v.category === cat);
        if (group.length === 0) return null;
        return (
          <section key={cat} className="mb-10">
            <h2 className="kicker mb-3">{CATEGORY_LABELS[cat]}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((vip) => (
                <VipCard key={vip.id} vip={vip} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
