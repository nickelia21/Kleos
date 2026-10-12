import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { GOOGLE_MODE } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = { title: "Log in — KLEOS" };

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/");
  return (
    <AuthCard title="Welcome back" subtitle="Log in with your email or phone number.">
      <LoginForm googleMode={GOOGLE_MODE} />
    </AuthCard>
  );
}
