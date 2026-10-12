"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { TraderAvatar } from "./TraderAvatar";

export function AccountMenu({
  name,
  handle,
  image,
}: {
  name: string;
  handle: string | null;
  image: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  async function signOut() {
    await authClient.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-line bg-panel-2 pl-1.5 pr-2.5 py-1 hover:border-faint transition-colors"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <TraderAvatar name={name} image={image} size={24} />
        <span className="text-sm font-medium text-cream max-w-[120px] truncate">
          {name}
        </span>
        <span className="text-[10px] text-faint">▾</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-line bg-panel p-1.5 shadow-xl shadow-black/40 z-50"
        >
          {handle && (
            <div className="px-2.5 py-1.5 text-xs text-faint border-b border-line-soft mb-1">
              @{handle}
            </div>
          )}
          <MenuLink href="/profile" onClick={() => setOpen(false)}>
            Profile
          </MenuLink>
          <MenuLink href="/portfolio" onClick={() => setOpen(false)}>
            Portfolio
          </MenuLink>
          <MenuLink href="/onboarding" onClick={() => setOpen(false)}>
            Creators you follow
          </MenuLink>
          <button
            role="menuitem"
            onClick={signOut}
            className="w-full text-left rounded-lg px-2.5 py-1.5 text-sm text-muted hover:bg-panel-2 hover:text-cream transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      role="menuitem"
      href={href}
      onClick={onClick}
      className="block rounded-lg px-2.5 py-1.5 text-sm text-muted hover:bg-panel-2 hover:text-cream transition-colors"
    >
      {children}
    </Link>
  );
}
