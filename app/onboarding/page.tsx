import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { getInterests } from "@/lib/interests";
import { getSessionUser } from "@/lib/session";
import { getVips } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata = { title: "Welcome — KLEOS" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { verified } = await searchParams;

  const interests = getInterests(user.id);
  const vips = getVips().map((v) => ({
    id: v.id,
    name: v.name,
    category: v.category,
    tagline: v.tagline,
  }));

  return (
    <div className="mx-auto max-w-2xl">
      {verified === "1" && (
        <div className="mb-5 rounded-lg border border-gain/40 bg-gain/10 p-3 text-xs text-gain">
          ✓ Verified — you&apos;re cleared to trade.
        </div>
      )}
      <p className="kicker mb-2">Welcome to Kleos</p>
      <h1 className="text-2xl font-bold tracking-tight mb-1.5">
        Set up your trading feed
      </h1>
      <p className="text-sm text-muted mb-6">
        Hey {user.name.split(" ")[0]} — a couple of optional steps and you&apos;re in.
      </p>
      <OnboardingFlow
        vips={vips}
        initialVipIds={interests
          .filter((i) => i.source === "onboarding_pick" && i.vipId)
          .map((i) => i.vipId!)}
        initialFreeText={interests
          .filter((i) => i.source === "free_text_request" && i.freeTextName)
          .map((i) => i.freeTextName!)}
        needsDob={!user.dob}
      />
    </div>
  );
}
