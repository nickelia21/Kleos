import Link from "next/link";
import { KBadge, Wordmark } from "@/components/Brand";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md py-8">
      <div className="flex items-center justify-center gap-2.5 mb-6">
        <Link href="/" className="flex items-center gap-2.5">
          <KBadge size={30} />
          <Wordmark className="text-sm" />
        </Link>
      </div>
      <div className="rounded-2xl border border-line bg-panel p-6 sm:p-8">
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <div className="text-xs text-muted leading-relaxed mt-1.5">{subtitle}</div>
        )}
        <div className="mt-5">{children}</div>
      </div>
      <p className="mt-4 text-center text-[11px] leading-relaxed text-faint">
        Virtual USD only — no real money, no withdrawals. 18+.
      </p>
    </div>
  );
}

export function Divider({ label = "or" }: { label?: string }) {
  return (
    <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-faint">
      <span className="h-px flex-1 bg-line" />
      {label}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export const inputCls =
  "w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-cream placeholder:text-faint focus:border-coral focus:outline-none";
export const labelCls = "block text-xs text-muted mb-1.5 mt-4 first:mt-0";
export const primaryBtnCls =
  "mt-5 w-full rounded-lg bg-coral text-bg py-2.5 text-sm font-semibold hover:bg-coral-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
