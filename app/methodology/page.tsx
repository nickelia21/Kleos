import { FEE_RATE, VIP_FEE_SHARE } from "@/lib/curve";

export const dynamic = "force-dynamic";

const SOURCES: { category: string; signals: string }[] = [
  {
    category: "Music & Artists",
    signals:
      "Google Trends search interest · streaming and catalog data (Luminate/Spotify) · short-form sound usage (TikTok Creative Center) · social engagement rates (Meta/TikTok APIs) · ticketing sell-through (public listings)",
  },
  {
    category: "Film/TV & Actors",
    signals:
      "Box office (Comscore) · streaming demand (Nielsen ratings) · verified casting and deal coverage (Variety/Deadline) · awards trackers (Gold Derby aggregate) · search interest (Google Trends)",
  },
  {
    category: "Sports",
    signals:
      "Official league/federation results and statistics feeds · verified transaction, draft, and sponsorship announcements · search interest (Google Trends) · social engagement (Meta/TikTok APIs)",
  },
  {
    category: "Creators & Influencers",
    signals:
      "Subscriber/follower growth (YouTube Data API, Twitch public API, TikTok API) · average concurrent viewership · engagement rates · search interest (Google Trends)",
  },
  {
    category: "Reality TV",
    signals:
      "Audience ratings (Nielsen) · verified network booking announcements · search interest (Google Trends) · social engagement (Meta/TikTok APIs)",
  },
];

export default function MethodologyPage() {
  return (
    <div className="max-w-3xl">
      <p className="kicker mb-2">Methodology</p>
      <h1 className="text-2xl font-bold tracking-tight mb-6">
        How Kleos prices, charges, and protects
      </h1>

      <div className="space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-cream font-semibold mb-2">The instrument</h2>
          <p>
            Kleos lists exactly one instrument per person: the VIP Index Share.
            It has no expiration and no settlement event — it is a persistent
            position in a VIP&apos;s public momentum, tradeable at any time
            against the curve. There are no event contracts, order books, or
            binary markets in this version.
          </p>
        </section>

        <section>
          <h2 className="text-cream font-semibold mb-2">The bonding curve</h2>
          <p className="mb-3">
            Each VIP&apos;s price is a deterministic, published function of
            shares outstanding:
          </p>
          <p className="rounded-lg bg-panel border border-line px-4 py-3 tabular text-cream mb-3">
            price = basePrice + slope × sharesOutstanding
          </p>
          <p className="mb-3">
            Buys pay the exact integral of the curve into the VIP&apos;s reserve
            pool and push the price up; sells draw the integral back out and push
            it down. Because the reserve always equals the area under the curve,
            every share is fully backed and the market is always liquid — no
            counterparty or order matching required. Each VIP&apos;s specific
            parameters are shown on their market page.
          </p>
          <p className="mb-3">
            Because your own trade moves along the curve as it fills, the blended
            price you pay differs from spot. Kleos shows this{" "}
            <span className="text-cream">price impact</span> — spot, blended
            average, impact %, and new spot — before you confirm any trade.
          </p>
          <p className="rounded-lg border border-amber/40 bg-amber/10 px-4 py-3 text-cream">
            Structural honesty: bonding curves favor early buyers. Whoever buys
            low on a curve profits from later arrivals, and late buyers into a
            heavily-bought curve carry more downside. Every market shows how much
            of its curve depth has already been bought — on the card, the market
            page, and inside the trade flow — so this dynamic is visible, never
            implicit.
          </p>
        </section>

        <section>
          <h2 className="text-cream font-semibold mb-2">Fees and the NIL revenue share</h2>
          <p>
            A flat {FEE_RATE * 100}% fee applies to every buy and sell — no
            maker/taker distinction, since there is no order book.{" "}
            {VIP_FEE_SHARE * 100}% of every fee goes to the VIP under their NIL
            license; the remainder funds the platform. Fees never touch the
            reserve pool, so fee revenue can never impair the curve&apos;s
            backing. This revenue share is the reason a VIP licenses their name,
            image, and likeness to Kleos — it is the business model.
          </p>
        </section>

        <section>
          <h2 className="text-cream font-semibold mb-2">The Interest Index</h2>
          <p className="mb-3">
            Each VIP carries a 0–100 Interest Index built only from named, public,
            professional signals. It informs listing parameters and gives traders
            a fundamentals reference — but trades always execute on the curve.
            The platform has no discretion over any input. Signals never include
            personal-life data: health, relationships, family, legal troubles,
            and private conduct are structurally excluded, and no market design
            may reward harassment, doxxing, or speculation on someone&apos;s
            misfortune.
          </p>
          <div className="rounded-xl border border-line overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-panel">
                <tr className="text-left text-faint">
                  <th className="px-3 py-2 font-medium w-44">Category</th>
                  <th className="px-3 py-2 font-medium">Named sources</th>
                </tr>
              </thead>
              <tbody>
                {SOURCES.map((s) => (
                  <tr key={s.category} className="border-t border-line-soft align-top">
                    <td className="px-3 py-2.5 text-cream font-medium">{s.category}</td>
                    <td className="px-3 py-2.5">{s.signals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-cream font-semibold mb-2">Consent and conduct</h2>
          <p>
            No listing exists without an executed NIL license signed by the VIP
            or their authorized representative — opt-in only, with contractual
            exit terms. Insider-trading-style rules bind VIPs, their teams, and
            platform staff: no trading on advance non-public information, and
            material news must be released through the verified updates channel.
            Access is 18+ and, in production, geofenced to permitted
            jurisdictions with identity verification.
          </p>
        </section>

        <section>
          <h2 className="text-cream font-semibold mb-2">Regulatory status</h2>
          <p>
            This prototype runs a closed-loop virtual currency: no real money, no
            deposits, no withdrawals, no cash value. A continuously priced share
            tied to a real person&apos;s career can constitute a security
            depending on structure and jurisdiction. Before any real-money
            version: securities analysis and registration or exemption,
            money-transmission licensing or a custodial partner, KYC/AML,
            state-by-state right-of-publicity review, and formal age/geo
            enforcement. Nothing here should be read as having solved those
            questions.
          </p>
        </section>

        <section>
          <h2 className="text-cream font-semibold mb-2">Roadmap</h2>
          <p>
            v2 may add event contracts — binary markets on specific verifiable
            outcomes — only under an appropriate regulatory framework. They are
            deliberately absent from this build.
          </p>
        </section>
      </div>
    </div>
  );
}
