"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BookOpen, LayoutDashboard, ListChecks, Menu, Wallet, X } from "lucide-react";
import { AdminTokenField } from "./admin-token-field";
import { Brand } from "./brand";
import { clearAdminSession, isDemoMode } from "../lib/api-client";
import { useState } from "react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/payouts", label: "Payout queue", icon: ListChecks },
  { href: "/activity", label: "Agent activity", icon: Activity },
  { href: "/fund", label: "Velo funding", icon: Wallet },
  { href: "/help", label: "Help & onboarding", icon: BookOpen },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const demo = isDemoMode();
  const close = () => setOpen(false);
  return <>
    <button aria-label="Open navigation" onClick={() => setOpen(true)} className="fixed left-4 top-4 z-40 rounded-xl border border-mist bg-white p-2.5 text-ink shadow-card md:hidden"><Menu size={18} /></button>
    {open && <button aria-label="Close navigation overlay" onClick={close} className="fixed inset-0 z-40 bg-ink/40 md:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(84vw,280px)] flex-col justify-between bg-ink px-5 py-6 text-warm transition-transform duration-300 md:w-64 md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <div>
        <div className="mb-10 flex items-center justify-between"><Link href="/" onClick={close}><Brand /></Link><button aria-label="Close navigation" onClick={close} className="rounded-lg p-1 text-mist/70 hover:bg-white/10 md:hidden"><X size={18} /></button></div>
        <div className="mb-5 rounded-xl border border-mint/20 bg-emerald/20 p-3"><div className="flex items-center gap-2 text-xs font-semibold"><span className={`status-dot ${demo ? "bg-amber" : "bg-mint"}`} />{demo ? "DEMO MODE · READ ONLY" : "LIVE API CONNECTED"}</div><p className="mt-1 text-[11px] leading-4 text-mist/60">{demo ? "Deterministic sample data. No admin mutations." : "Requests use a server-side HttpOnly session."}</p></div>
        <nav className="space-y-1" aria-label="Operations navigation">{NAV.map(({ href, label, icon: Icon }) => { const active = pathname === href; return <Link key={href} href={href} onClick={close} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${active ? "bg-emerald text-warm" : "text-mist/75 hover:bg-white/5 hover:text-warm"}`}><Icon size={17} />{label}</Link>; })}</nav>
      </div>
      <div className="space-y-3"><AdminTokenField /><button onClick={async () => { await clearAdminSession(); window.location.reload(); }} className="w-full text-left text-[11px] text-mist/50 hover:text-mint">Reset to demo mode</button></div>
    </aside>
  </>;
}
