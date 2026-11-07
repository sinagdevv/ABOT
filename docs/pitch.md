# Pitch notes

## One-liner
**abot. — making every peso reach its purpose.** An autonomous agent that
executes pre-approved civic cash-assistance payouts on Stellar, with every
step backed by a real, verifiable on-chain transaction.

## The problem
Eligibility review and payment *execution* are entangled in most cash-aid
programs. Funds are approved, then sit in a queue for manual transfer —
with no transparent, auditable trigger for release, and no proof a payment
actually settled beyond a spreadsheet cell changing color.

## The insight
You don't need an LLM to be "agentic." You need a deterministic decision
engine that (a) only acts when an on-chain policy says it may, (b) never
fabricates a success state, and (c) leaves an audit trail a human can
actually follow. ABOT's agent is fully explainable: every decision traces
back to a named contract refusal reason or a confirmed transaction hash.

## How it works
Noir provides the escrow primitive — a device-linked agent key, a spending
policy (asset, cap, expiry), and a claim step for the recipient. Velo
provides the fiat/stablecoin on-ramp for the organization's operating
balance. ABOT is the glue: a state machine and decision engine that
evaluates, funds, authorizes, and audits, with Postgres-level concurrency
safety (`FOR UPDATE SKIP LOCKED`) so the same payout can never be paid
twice.

## Why it matters
- **Beneficiaries** get payouts the moment policy allows — not when someone
  remembers to click send.
- **Auditors** get a complete, queryable decision log, not a bank
  statement.
- **Organizations** keep a hard separation between "funds arrived" (Velo)
  and "funds are at risk in escrow" (Noir) — a deliberate control point,
  not an automatic cascade.

## What's real today
A live Testnet run of the entire Noir lifecycle (register, fund, authorize,
claim) with confirmed, independently verifiable transaction hashes — see
`docs/testnet-evidence.md`. The public Vercel deployment and anonymous route
boundary are reachable. The decision engine, state machine, and
duplicate-payment protection are unit-tested. The operator screens, read-only
DEMO MODE, server-side admin session bridge, and wallet-signed claim boundary
are built. Hosted Supabase, authenticated runtime, Velo checkout/webhook, and
recipient-wallet settlement proof remain unverified in this release pass.

## What's next
Real Supabase, Noir, Velo, and admin configuration plus a compatible recipient
wallet complete the hosted authenticated demo; the public read-only demo is
already available at `https://abot-web.vercel.app/` (see README → Blockers).
