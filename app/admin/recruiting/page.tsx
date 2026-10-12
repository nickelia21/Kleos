import { notFound } from "next/navigation";
import { fmtDate } from "@/lib/format";
import { recruitingPipeline } from "@/lib/interests";

export const dynamic = "force-dynamic";

// INTERNAL VIP-recruiting pipeline — ranked list of creators traders asked
// for ("Who should we bring to Kleos?") who aren't listed yet. Env-gated
// (ADMIN_RECRUITING=1), deliberately unpolished: this is an internal tool,
// not a product surface. Real admin auth is out of scope for the prototype.

export const metadata = { title: "Recruiting pipeline — KLEOS internal" };

export default function RecruitingPage() {
  if (process.env.ADMIN_RECRUITING !== "1") notFound();
  const rows = recruitingPipeline();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 rounded-lg border border-amber/40 bg-amber/10 p-3 text-xs text-amber">
        Internal view — enabled by <code className="font-semibold">ADMIN_RECRUITING=1</code>.
        Do not expose on a shared deployment.
      </div>
      <p className="kicker mb-2">VIP recruiting pipeline</p>
      <h1 className="text-2xl font-bold tracking-tight mb-1.5">
        Most-requested creators not yet on Kleos
      </h1>
      <p className="text-sm text-muted mb-6">
        Free-text requests from the onboarding picker and profile page, ranked
        by distinct requesting traders. This is the licensing outreach list —
        nobody gets listed without an executed NIL deal.
      </p>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-panel/40 p-8 text-center text-sm text-muted">
          No requests yet. They&apos;ll appear as traders fill in “Who should we
          bring to Kleos?”.
        </div>
      ) : (
        <div className="rounded-xl border border-line overflow-x-auto">
          <table className="w-full text-xs min-w-[520px]">
            <thead className="bg-panel">
              <tr className="text-left text-faint">
                <th className="px-3 py-2.5 font-medium w-10">#</th>
                <th className="px-3 py-2.5 font-medium">Requested creator</th>
                <th className="px-3 py-2.5 font-medium text-right">Requests</th>
                <th className="px-3 py-2.5 font-medium text-right">First</th>
                <th className="px-3 py-2.5 font-medium text-right">Latest</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.name} className="border-t border-line-soft">
                  <td className="px-3 py-2.5 text-faint tabular">{i + 1}</td>
                  <td className="px-3 py-2.5 font-medium text-cream">{row.name}</td>
                  <td className="px-3 py-2.5 text-right tabular text-coral font-semibold">
                    {row.requests}
                  </td>
                  <td className="px-3 py-2.5 text-right text-faint whitespace-nowrap">
                    {fmtDate(row.firstRequested)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-faint whitespace-nowrap">
                    {fmtDate(row.lastRequested)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
