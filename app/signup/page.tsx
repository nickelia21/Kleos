import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/SignupForm";
import { GOOGLE_MODE } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = { title: "Create account — KLEOS" };

export default async function SignupPage() {
  if (await getSessionUser()) redirect("/profile");
  return (
    <AuthCard
      title="Create your trader account"
      subtitle="Sign up with an email or a phone number — your choice. You start with $10,000 in virtual USD."
    >
      <SignupForm googleMode={GOOGLE_MODE} />
    </AuthCard>
  );
}
