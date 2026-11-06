"use client";

import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useEffect, useState } from "react";

const KEY = "abot_onboarding_complete";
const STEPS = [
  ["Welcome to ABOT", "This is a calm operating layer for approved assistance payouts. The demo is labeled and uses deterministic sample data."],
  ["Your command center", "The overview keeps payout volume, value, and anything needing attention visible at a glance.", "metrics"],
  ["Approved payouts", "A payout starts with human approval. ABOT carries the recipient, amount, asset, and due date through the journey.", "payouts"],
  ["The autonomous agent", "The agent evaluates policy and escrow on due payouts. Its decision and reason stay in the activity trail.", "agent"],
  ["Funding, kept separate", "Velo can fund the operating balance. Noir escrow funding is a distinct owner-side action.", "funding"],
  ["Noir authorization and claims", "Authorized payouts are claimed by the recipient with a wallet-signed transaction — never a private key.", "journey"],
  ["Verification is the product", "Use the audit trail to understand every hold, authorization, and human-review state.", "audit"],
] as const;

export function OnboardingTour() {
  const [step, setStep] = useState<number | null>(null);
  const [spotlight, setSpotlight] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  useEffect(() => { if (window.localStorage.getItem(KEY) !== "1") setStep(0); }, []);
  useEffect(() => {
    if (step === null) return;
    const target = STEPS[step][2];
    const el = target ? document.querySelector(`[data-tour="${target}"]`) : null;
    if (!el) { setSpotlight(null); return; }
    const rect = el.getBoundingClientRect();
    setSpotlight({ top: rect.top - 8, left: rect.left - 8, width: rect.width + 16, height: rect.height + 16 });
  }, [step]);
  if (step === null) return null;
  const [title, body] = STEPS[step];
  const finish = () => { window.localStorage.setItem(KEY, "1"); setStep(null); };
  return <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="ABOT onboarding tour">
    <div className="absolute inset-0 bg-ink/60" />
    {spotlight && <div className="pointer-events-none absolute rounded-2xl border-2 border-mint shadow-[0_0_0_9999px_rgba(11,23,36,.6)]" style={spotlight} />}
    <section className="absolute bottom-5 left-5 right-5 max-w-md rounded-2xl border border-mint/25 bg-ink p-5 text-warm shadow-2xl md:bottom-10 md:left-auto md:right-10" onKeyDown={(e) => { if (e.key === "Escape") finish(); }} tabIndex={-1}>
      <div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-[.18em] text-mint">ABOT guide · {step + 1} / {STEPS.length}</p><h2 className="mt-2 text-xl font-semibold tracking-[-.04em]">{title}</h2></div><button onClick={finish} aria-label="Skip tutorial" className="rounded-lg p-1 text-mist/60 hover:bg-white/10 hover:text-warm"><X size={17} /></button></div><p className="text-sm leading-6 text-mist/70">{body}</p><div className="mt-6 flex items-center justify-between"><div className="flex gap-1.5">{STEPS.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-mint" : "w-1.5 bg-mist/30"}`} />)}</div><div className="flex gap-2">{step > 0 && <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 rounded-lg border border-mist/20 px-3 py-2 text-xs text-mist hover:border-mint hover:text-mint"><ArrowLeft size={14} /> Back</button>}<button onClick={() => step === STEPS.length - 1 ? finish() : setStep(step + 1)} className="flex items-center gap-1 rounded-lg bg-mint px-3 py-2 text-xs font-semibold text-ink">{step === STEPS.length - 1 ? "Finish" : "Next"} <ArrowRight size={14} /></button></div></div>
    </section>
  </div>;
}
