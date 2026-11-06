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

**0:35–1:05 — Create and run a payout**
On `/payouts`, create a payout (recipient, amount, due date). Switch to
`/dashboard`, click **Run agent sweep**. Point out the status flipping from
`pending` to `authorized`, and the transaction hash appearing in the queue.

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
