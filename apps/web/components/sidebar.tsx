"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BookOpen, LayoutDashboard, ListChecks, LogIn, LogOut, Menu, Settings, Wallet, X } from "lucide-react";
import { Brand } from "./brand";
import { clearAdminSession, isLiveSession } from "../lib/api-client";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/payouts", label: "Payout queue", icon: ListChecks },
  { href: "/activity", label: "Agent activity", icon: Activity },
  { href: "/fund", label: "Velo funding", icon: Wallet },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/help", label: "Help & onboarding", icon: BookOpen },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const sync = () => setLive(isLiveSession());
    sync();
    window.addEventListener("abot-mode-change", sync);
    return () => window.removeEventListener("abot-mode-change", sync);
  }, []);
  const close = () => setOpen(false);
  return <>
    <button aria-label="Open navigation" onClick={() => setOpen(true)} className="fixed left-4 top-4 z-40 rounded-xl border border-mist bg-white p-2.5 text-ink shadow-card md:hidden"><Menu size={18} /></button>
    {open && <button aria-label="Close navigation overlay" onClick={close} className="fixed inset-0 z-40 bg-ink/40 md:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(84vw,280px)] flex-col justify-between bg-ink px-5 py-6 text-warm transition-transform duration-300 md:w-64 md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <div>
        <div className="mb-10 flex items-center justify-between"><Link href="/" onClick={close}><Brand /></Link><button aria-label="Close navigation" onClick={close} className="rounded-lg p-1 text-mist/70 hover:bg-white/10 md:hidden"><X size={18} /></button></div>
        <div className={`mb-5 rounded-xl border p-3 ${live ? "border-mint/25 bg-emerald/25" : "border-amber/25 bg-amber/10"}`}><div className="flex items-center gap-2 text-xs font-semibold"><span className={`status-dot ${live ? "bg-mint" : "bg-amber"}`} />{live ? "LIVE TESTNET · SESSION" : "DEMO MODE · SIMULATED"}</div><p className="mt-1 text-[11px] leading-4 text-mist/60">{live ? "Authenticated server requests only." : "Fictional records. No blockchain transaction."}</p></div>
        <nav className="space-y-1" aria-label="Operations navigation">{NAV.map(({ href, label, icon: Icon }) => { const active = pathname === href; return <Link key={href} href={href} onClick={close} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${active ? "bg-emerald text-warm" : "text-mist/75 hover:bg-white/5 hover:text-warm"}`}><Icon size={17} />{label}</Link>; })}</nav>
      </div>
      <div className="space-y-3"><div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-mist/45">Workspace mode</p>{live ? <button onClick={async () => { await clearAdminSession(); window.location.reload(); }} className="mt-2 flex w-full items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-left text-xs text-mist/75 hover:border-mint/50 hover:text-mint"><LogOut size={14} /> Sign out to Demo</button> : <Link href="/sign-in" onClick={close} className="mt-2 flex items-center gap-2 rounded-lg border border-mint/35 bg-mint/10 px-3 py-2 text-xs font-semibold text-mint hover:bg-mint/20"><LogIn size={14} /> Enter Live Testnet</Link>}</div><p className="flex items-center gap-2 px-1 text-[11px] text-mist/40"><span className="h-1.5 w-1.5 rounded-full bg-mint" /> Testnet only · human review stays on</p></div>
    </aside>
  </>;
}
