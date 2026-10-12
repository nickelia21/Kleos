import Link from "next/link";
import { redirect } from "next/navigation";
import { InterestPicker } from "@/components/InterestPicker";
import { ContactCard } from "@/components/profile/ContactCard";
import { DangerZone } from "@/components/profile/DangerZone";
import { IdentityCard } from "@/components/profile/IdentityCard";
import { InstagramCard } from "@/components/profile/InstagramCard";
import {
  SignInMethodsCard,
  type Identity,
} from "@/components/profile/SignInMethodsCard";
import { Avatar } from "@/components/VipCard";
import { GOOGLE_MODE } from "@/lib/auth";
import { spotPrice } from "@/lib/curve";
import { getDb } from "@/lib/db";
import { fmtDate, fmtUsd, parseDbDate } from "@/lib/format";
import { isPlaceholderEmail } from "@/lib/identifier";
import { getInterests } from "@/lib/interests";
import { getSessionUser } from "@/lib/session";
import { getTraderPortfolio, getVips } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata = { title: "Your profile — KLEOS" };

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const identities = (
    getDb()
      .prepare(
        "SELECT id, providerId, createdAt FROM account WHERE userId = ? ORDER BY createdAt"
      )
      .all(user.id) as { id: string; providerId: string; createdAt: unknown }[]
  ).map(
    (a): Identity => ({
      id: a.id,
      providerId: a.providerId,
      createdAt: fmtDate(parseDbDate(a.createdAt)),
    })
  );

  const interests = getInterests(user.id);
  const portfolio = getTraderPortfolio(user.id);
  const vips = getVips();
  const byId = new Map(vips.map((v) => [v.id, v]));
  const positionsValue = Object.values(portfolio.positions).reduce((sum, p) => {
    const vip = byId.get(p.vipId);
    return sum + (vip ? p.shares * spotPrice(vip.curve, vip.sharesOutstanding) : 0);
  }, 0);
  const watched = vips.filter((v) => portfolio.watchlist.includes(v.id));

  const email = isPlaceholderEmail(user.email) ? null : user.email;

  return (
    <div>
      <p className="kicker mb-2">Account</p>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Your profile</h1>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px] items-start">
        <div className="space-y-5 min-w-0">
          <IdentityCard
            name={user.name}
            handle={user.handle ?? ""}
            image={user.image ?? null}
            joined={fmtDate(parseDbDate(user.createdAt))}
          />
          <ContactCard
            email={email}
            emailVerified={!!email && user.emailVerified}
            phone={user.phoneNumber ?? null}
            phoneVerified={!!user.phoneNumberVerified}
          />
          <SignInMethodsCard
            identities={identities}
            googleMode={GOOGLE_MODE}
            userInputs={[user.email, user.name, user.handle ?? ""]}
          />
          <InstagramCard instagramHandle={user.instagramHandle ?? null} />
          <section className="rounded-xl border border-line bg-panel p-5">
            <h2 className="kicker mb-1.5">Creators you follow</h2>
            <p className="text-[11px] text-faint leading-relaxed mb-4">
              Powers your feed and our licensing pipeline. Watchlist stars count
              as interest automatically.
            </p>
            <InterestPicker
              vips={vips.map((v) => ({
                id: v.id,
                name: v.name,
                category: v.category,
                tagline: v.tagline,
              }))}
              initialVipIds={interests
                .filter((i) => i.source === "onboarding_pick" && i.vipId)
                .map((i) => i.vipId!)}
              initialFreeText={interests
                .filter((i) => i.source === "free_text_request" && i.freeTextName)
                .map((i) => i.freeTextName!)}
              saveLabel="Save interests"
            />
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-xl border border-line bg-panel p-5">
            <h2 className="kicker mb-4">Portfolio</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-[11px] text-faint">Cash balance</div>
                <div className="font-semibold tabular mt-0.5">{fmtUsd(user.balance)}</div>
              </div>
              <div>
                <div className="text-[11px] text-faint">Positions (spot)</div>
                <div className="font-semibold tabular mt-0.5">{fmtUsd(positionsValue)}</div>
              </div>
            </div>
            <Link
              href="/portfolio"
              className="mt-4 inline-block rounded-lg bg-coral text-bg px-4 py-2 text-xs font-semibold hover:bg-coral-soft transition-colors"
            >
              Open portfolio →
            </Link>
          </section>

          <section className="rounded-xl border border-line bg-panel p-5">
            <h2 className="kicker mb-4">Watchlist</h2>
            {watched.length === 0 ? (
              <p className="text-xs text-faint">
                Nothing yet — star a VIP from their market page.
              </p>
            ) : (
              <div className="space-y-2">
                {watched.map((vip) => (
                  <Link
                    key={vip.id}
                    href={`/vip/${vip.slug}`}
                    className="flex items-center gap-2.5 rounded-lg border border-line-soft bg-panel-2 px-3 py-2 hover:border-faint transition-colors"
                  >
                    <Avatar vip={vip} size={24} />
                    <span className="text-xs font-medium flex-1 truncate">{vip.name}</span>
                    <span className="text-xs tabular text-muted">
                      {fmtUsd(spotPrice(vip.curve, vip.sharesOutstanding))}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <DangerZone />
        </div>
      </div>
    </div>
  );
}
