"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, LayoutDashboard, ListChecks, Wallet } from "lucide-react";
import { AdminTokenField } from "./admin-token-field";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/payouts", label: "Payout queue", icon: ListChecks },
  { href: "/activity", label: "Agent activity", icon: Activity },
  { href: "/fund", label: "Velo funding", icon: Wallet },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col justify-between bg-ink px-4 py-6 text-warm">
      <div>
        <Link href="/" className="mb-10 block px-2 text-lg font-semibold tracking-tight">
          abot<span className="text-mint">.</span>
        </Link>
        <nav className="space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active ? "bg-emerald text-warm" : "text-mist/80 hover:bg-white/5 hover:text-warm"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      <AdminTokenField />
    </aside>
  );
}
