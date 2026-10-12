import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Reset password — KLEOS" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      subtitle="Tell us how you sign in and we'll send reset instructions."
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
