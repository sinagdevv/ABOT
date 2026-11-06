# Two-minute demo script

**0:00–0:15 — Hook**
"Government cash assistance gets approved fast and paid slowly. ABOT makes
the payout itself autonomous — on Stellar, verifiably, with no human
clicking 'send' for a payment that's already been approved."

**0:15–0:35 — Landing + the flow**
Open the landing page. Walk the five numbered steps: admin approves → agent
evaluates → funds if short → authorizes on-chain → recipient claims. "Every
one of these is a real contract call or a signed API request — nothing here
is simulated."

**0:35–1:05 — Show the operator surface**
Open `/dashboard` in the clearly labeled read-only DEMO MODE. Walk through
approved, authorized, claimed, needs-funding, and manual-review states. For a
live recording only, connect the short-lived admin session first, then create a
payout on `/payouts` and run the secured agent sweep.

**1:05–1:25 — Show the refusal path**
Create a second payout that exceeds the agent's policy cap (or predates
sufficient escrow). Run the sweep again. On `/activity`, show the decision:
`hold_over_limit` / `hold_needs_funding`, with the contract's own refusal
reason as the logged reason — "the agent never guesses; it asks the
contract."

**1:25–1:45 — Funding flow**
On `/fund`, show a Velo checkout session opened automatically for the
underfunded payout, and explain the deliberate separation: Velo tops up
ABOT's balance; funding the Noir escrow is a distinct, audited step.

**1:45–2:00 — Proof, not a promise**
Pull up `docs/testnet-evidence.md` (or Stellar Expert) and show a real,
confirmed transaction hash from this exact flow. "Making every peso reach
its purpose — and proving it, on-chain, every time."

## Recording checklist

- Use DEMO MODE unless real Supabase, Noir, Velo, and admin configuration has
  been validated beforehand.
- Never show or paste `.env.local`, service-role keys, agent secrets, Velo
  secrets, or recipient private keys.
- Keep the Testnet label visible; XLM shown is not Philippine pesos.
- If showing live admin actions, capture the session boundary, payout status,
  agent activity, and the exact returned transaction reference.
- Keep Velo paid status and Noir escrow funding visibly separate.
