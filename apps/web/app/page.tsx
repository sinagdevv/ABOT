import Link from "next/link";
import { ArrowRight, ShieldCheck, Timer, Wallet2 } from "lucide-react";

const STEPS = [
  { title: "Admin approves", body: "A caseworker creates a payout: recipient, amount, due date. Eligibility is always human-approved." },
  { title: "Agent evaluates", body: "On its due date, the agent checks the Noir escrow, the authorization policy, and prior transactions — against the contract's own rules." },
  { title: "Funding, if short", body: "If escrow can't cover it, the agent opens a Velo checkout session for the organization to top up. It never invents a transfer." },
  { title: "Authorized on-chain", body: "Once policy and funding check out, the agent calls Noir's authorizePayment directly — a real Testnet transaction, not a simulated one." },
  { title: "Recipient claims", body: "The beneficiary claims their payment through Noir. ABOT shows the transaction hash — never a success state without on-chain proof." },
];

export default function LandingPage() {
  return (
    <div className="bg-warm">
      <section className="bg-ink px-6 py-24 text-warm">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-mint">Civic fintech · Stellar Testnet</p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            abot<span className="text-mint">.</span>
          </h1>
          <p className="mt-6 text-lg text-mist/90 md:text-xl">Making every peso reach its purpose.</p>
          <p className="mx-auto mt-4 max-w-xl text-sm text-mist/70">
            ABOT autonomously processes pre-approved financial assistance through Velo + Noir — a deterministic
            agent that funds, authorizes, and audits every payout on-chain.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg bg-emerald px-5 py-3 text-sm font-medium text-warm hover:bg-mint hover:text-ink"
            >
              Open dashboard <ArrowRight size={16} />
            </Link>
            <Link
              href="/activity"
              className="flex items-center gap-2 rounded-lg border border-mist/30 px-5 py-3 text-sm font-medium text-warm hover:bg-white/5"
            >
              View agent activity
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="mb-2 text-center text-2xl font-semibold text-ink">How a payout actually moves</h2>
        <p className="mb-12 text-center text-sm text-ink/60">
          Every step below is a real call to a deployed contract or a signed Velo API request — nothing simulated.
        </p>
        <ol className="grid gap-6 md:grid-cols-5">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-xl2 border border-mist bg-white p-5 shadow-card">
              <span className="mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-emerald text-xs font-semibold text-warm">
                {i + 1}
              </span>
              <h3 className="mb-1 text-sm font-semibold text-ink">{step.title}</h3>
              <p className="text-xs text-ink/60">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-mist bg-mist/30 px-6 py-16">
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
          <Principle icon={ShieldCheck} title="Verified, never assumed" body="A payout only shows as successful once there's a confirmed Testnet transaction hash behind it." />
          <Principle icon={Timer} title="Autonomous execution" body="The agent decides when to authorize, fund, or hold — deterministically, from on-chain policy, no human in the loop for execution." />
          <Principle icon={Wallet2} title="Separation of concerns" body="Velo moves fiat-to-stable value into the org's balance. Funding Noir escrow stays a deliberate, separate action." />
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-xs text-ink/40">abot. · Built on Stellar Testnet · Noir + Velo</footer>
    </div>
  );
}

function Principle({ icon: Icon, title, body }: { icon: typeof ShieldCheck; title: string; body: string }) {
  return (
    <div>
      <Icon className="mb-3 text-emerald" size={22} />
      <h3 className="mb-1 text-sm font-semibold text-ink">{title}</h3>
      <p className="text-xs text-ink/60">{body}</p>
    </div>
  );
}
