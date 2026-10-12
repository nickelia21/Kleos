import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { AccountMenu } from "@/components/AccountMenu";
import { AgeGate } from "@/components/AgeGate";
import { KBadge, Wordmark } from "@/components/Brand";
import { fmtUsd } from "@/lib/format";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "KLEOS — The exchange for public attention",
  description:
    "Trade licensed VIP Index Shares priced by a transparent bonding curve. Prototype — virtual USD only.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <AgeGate />
        <header className="border-b border-line bg-panel/60 backdrop-blur sticky top-0 z-40">
          <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-7">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <KBadge size={34} />
              <Wordmark className="text-lg" />
            </Link>
            <nav className="flex items-center gap-5 text-sm font-semibold text-muted overflow-x-auto">
              <Link href="/" className="hover:text-cream transition-colors whitespace-nowrap">
                Markets
              </Link>
              <Link href="/portfolio" className="hover:text-cream transition-colors whitespace-nowrap">
                Portfolio
              </Link>
              <Link href="/vip-dashboard" className="hover:text-cream transition-colors whitespace-nowrap">
                VIP Dashboard
              </Link>
              <Link href="/methodology" className="hover:text-cream transition-colors whitespace-nowrap">
                Methodology
              </Link>
            </nav>
            {user ? (
              <div className="ml-auto flex items-center gap-2.5">
                <div className="rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-sm tabular whitespace-nowrap hidden sm:block">
                  <span className="text-muted">Balance</span>{" "}
                  <span className="font-semibold">{fmtUsd(user.balance)}</span>
                  <span className="text-faint"> · virtual</span>
                </div>
                <AccountMenu
                  name={user.name}
                  handle={user.handle ?? null}
                  image={user.image ?? null}
                />
              </div>
            ) : (
              <div className="ml-auto flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted hover:text-cream hover:border-faint transition-colors whitespace-nowrap"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-coral text-bg px-3 py-1.5 text-sm font-semibold hover:bg-coral-soft transition-colors whitespace-nowrap"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-8 flex-1">{children}</main>

        <footer className="border-t border-line mt-12">
          <div className="mx-auto max-w-6xl px-4 py-6 text-[11px] leading-relaxed text-faint space-y-1">
            <p>
              Kleos prototype — virtual USD only. No real money, no deposits, no
              withdrawals, no real KYC. All VIPs are fictional; a production
              listing requires an executed NIL license. 18+ · geofenced in
              production · insider-trading rules apply to VIPs and their teams.
            </p>
            <p>
              A real-money version of this product would require securities,
              money-transmission, and right-of-publicity review before launch.
              See <Link href="/methodology" className="text-muted hover:text-cream underline">Methodology</Link>.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
