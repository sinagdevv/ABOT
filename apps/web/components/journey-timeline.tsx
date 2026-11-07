"use client";

import { useState } from "react";

const STAGES = [
  ["01", "Waiting", "The approved record exists, but the due date has not opened the execution window yet.", "The operator can see what is approved without pretending it is in motion."],
  ["02", "Funding", "Noir reports insufficient escrow. ABOT creates one idempotent Velo operating-balance request and holds the payout.", "Two balances stay separate: Velo does not fund Noir escrow automatically."],
  ["03", "Authorization", "The agent checks the contract policy, asset, expiry, amount, and escrow before using a stable nonce.", "A passing authorization is stored with its confirmed Testnet transaction hash."],
  ["04", "Arrival", "The recipient wallet signs the claim transaction. ABOT submits it and waits for Noir confirmation.", "If the outcome is uncertain, the record stops in manual review instead of retrying blindly."],
] as const;

export function JourneyTimeline() {
  const [active, setActive] = useState(0);
  const stage = STAGES[active];
  return <div className="rounded-[1.75rem] border border-mist bg-white p-5 shadow-card md:p-7"><div className="grid gap-2 sm:grid-cols-4">{STAGES.map(([number, title], index) => <button key={number} type="button" aria-pressed={active === index} onClick={() => setActive(index)} className={`rounded-2xl border p-4 text-left transition ${active === index ? "border-emerald bg-emerald text-warm" : "border-mist bg-warm text-ink hover:border-emerald/40"}`}><span className={`text-[10px] font-semibold tracking-[.16em] ${active === index ? "text-mint" : "text-emerald"}`}>{number}</span><span className="mt-7 block text-sm font-semibold">{title}</span></button>)}</div><div className="mt-5 grid gap-5 rounded-2xl bg-ink p-5 text-warm md:grid-cols-[.75fr_1.25fr] md:p-6"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-mint">Selected state</p><h3 className="mt-3 text-2xl font-semibold tracking-[-.04em]">{stage[1]}</h3></div><div><p className="text-sm leading-6 text-mist/75">{stage[2]}</p><p className="mt-4 border-l border-mint/50 pl-3 text-xs leading-5 text-mist/55">{stage[3]}</p></div></div></div>;
}
