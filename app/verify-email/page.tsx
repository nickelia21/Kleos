import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { VerifyEmailActions } from "@/components/auth/VerifyEmailActions";
import { isPlaceholderEmail } from "@/lib/identifier";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = { title: "Verify your email — KLEOS" };

export default async function VerifyEmailPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (isPlaceholderEmail(user.email)) redirect("/verify-phone");
  if (user.emailVerified) redirect("/onboarding");

  return (
    <AuthCard
      title="Check your email"
      subtitle={
        <>
          We sent a verification link to <span className="text-cream">{user.email}</span>.
          You can browse markets now, but verification is required before your first trade.
        </>
      }
    >
      <div className="rounded-lg border border-amber/40 bg-amber/10 p-3 text-xs leading-relaxed text-amber">
        Prototype: no real email is sent. The verification link is printed to
        the <span className="font-semibold">npm run dev</span> terminal by the
        dev mailer.
      </div>
      <VerifyEmailActions email={user.email} />
      <p className="mt-5 text-xs text-muted">
        <Link href="/" className="text-coral hover:text-coral-soft">
          Browse markets while you wait →
        </Link>
      </p>
    </AuthCard>
  );
}
