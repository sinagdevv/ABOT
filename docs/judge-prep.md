# Judge prep

## Five-minute pitch outline

- **0:00–0:35 — Problem:** approved civic aid still waits on manual payment
  execution, with weak evidence of what happened.
- **0:35–1:20 — Solution:** ABOT is a deterministic agent for approved payouts;
  humans approve eligibility, while policy, escrow, and audit checks govern
  execution.
- **1:20–2:05 — Architecture:** Velo handles the operating-balance checkout;
  Noir handles device-linked escrow authorization and recipient claim. They are
  deliberately separate systems.
- **2:05–3:20 — Demo:** open the public site, skip the intro, enter Demo Mode,
  create a simulated payout, run evaluation, inspect the activity decision, use
  Settings to replay/reset, and show the sign-in boundary.
- **3:20–4:15 — Proof:** open `docs/testnet-evidence.md` and show the real
  Testnet register, fund, authorize, and claim transaction links.
- **4:15–5:00 — Trust and close:** show the manual-review path, explain that a
  Velo checkout never masquerades as Noir escrow funding, and close with:
  “Every peso has a decision, a boundary, and evidence.”

## Likely judge questions

**Why is this agentic without an LLM?** The value is constrained action: the
agent evaluates due payouts against the contract's own policy, acts only when
allowed, and records the reason. Determinism makes the payment path auditable.

**How do you prevent duplicate payouts?** Stable idempotency keys, an atomic
database claim using `FOR UPDATE SKIP LOCKED`, and Noir's policy/nonce checks
work together. Uncertain authorization outcomes move to manual review instead
of being blindly retried.

**What does Velo fund?** Velo funds ABOT's operating balance. Noir escrow is a
separate owner-side action, so a paid checkout cannot be presented as a funded
or authorized payout.

**Where are the secrets and private keys?** Service-role, agent, and Velo
secrets stay server-side. The recipient signs the claim transaction externally;
ABOT accepts the signed XDR and never receives a recovery phrase.

**What is live versus simulated?** The public site and Demo Mode are live, but
Demo Mode is explicitly fictional and creates no blockchain transaction. The
Noir lifecycle has real Testnet evidence in `docs/testnet-evidence.md`.

## Capability boundary

### Demonstrated

- Public Vercel pages and unauthenticated protected-route boundary.
- Local tests: 14 passing; web/agent/shared typecheck; production build.
- Deterministic Demo Mode payout, evaluation, funding, claim, reset, settings,
  tutorial, and navigation paths in the shipped frontend.
- Real Noir Testnet register → fund → authorize → claim evidence with public
  transaction hashes.
- Server-side HttpOnly admin-session bridge and 401 behavior without a token.

### Unverified in this release pass

- Browser click-through and mobile/desktop visual QA; the browser automation
  host was unavailable.
- Authenticated production Supabase reads/writes.
- Deployed Velo checkout creation, signed webhook delivery, and settlement.
- A fresh deployed-backend Noir payout and a recipient wallet-signed claim.
- Recorded MP4 or generated slide file; the repository contains ready-to-use
  script and pitch content instead.
