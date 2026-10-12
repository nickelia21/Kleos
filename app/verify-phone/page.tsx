import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { OtpForm } from "@/components/auth/OtpForm";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = { title: "Verify your phone — KLEOS" };

export default async function VerifyPhonePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.phoneNumber) redirect("/profile");
  if (user.phoneNumberVerified) redirect("/onboarding");

  return (
    <AuthCard
      title="Enter your verification code"
      subtitle={
        <>
          We texted a 6-digit code to <span className="text-cream">{user.phoneNumber}</span>.
          Verification is required before your first trade.
        </>
      }
    >
      <div className="mb-5 rounded-lg border border-amber/40 bg-amber/10 p-3 text-xs leading-relaxed text-amber">
        Prototype: no real SMS is sent. The code is printed to the{" "}
        <span className="font-semibold">npm run dev</span> terminal by the dev
        SMS mock.
      </div>
      <OtpForm phone={user.phoneNumber} />
    </AuthCard>
  );
}
