import { notFound } from "next/navigation";
import { TraderAvatar } from "@/components/TraderAvatar";
import { getDb } from "@/lib/db";
import { fmtDate, parseDbDate } from "@/lib/format";

export const dynamic = "force-dynamic";

// Public-ish trader profile: display name, @handle, avatar, joined date.
// Balances, holdings and contact info are owner-only (/profile).

export default async function TraderPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const trader = getDb()
    .prepare(
      "SELECT name, handle, image, createdAt FROM user WHERE handle = ? AND deletedAt IS NULL"
    )
    .get(handle.toLowerCase()) as
    | { name: string; handle: string; image: string | null; createdAt: unknown }
    | undefined;
  if (!trader) notFound();

  return (
    <div className="mx-auto max-w-md py-10">
      <div className="rounded-2xl border border-line bg-panel p-8 text-center">
        <div className="flex justify-center mb-4">
          <TraderAvatar name={trader.name} image={trader.image} size={72} />
        </div>
        <h1 className="text-xl font-bold tracking-tight">{trader.name}</h1>
        <p className="text-sm text-coral mt-0.5">@{trader.handle}</p>
        <p className="text-[11px] text-faint mt-3">
          Trading on Kleos since {fmtDate(parseDbDate(trader.createdAt))}
        </p>
      </div>
      <p className="mt-4 text-center text-[11px] text-faint">
        Portfolios and balances are private to each trader.
      </p>
    </div>
  );
}
