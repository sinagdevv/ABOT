# abot.

**Making every peso reach its purpose.**

ABOT (Autonomous Beneficiary Outreach & Transfers) is a civic-fintech agent that
executes pre-approved financial assistance payouts on Stellar Testnet,
autonomously — funding, authorizing, and auditing every transfer through
[Noir](https://github.com/rylsherdamz-rgb/Noir_Wallet)'s escrow contracts and
[Velo](https://www.velo-build.dev)'s checkout/webhook rails.

## Links

- Repo: this one (`feat/abot-hackathon-mvp` branch)
- Live deployment: **not yet deployed** — this environment has no Vercel/Supabase
  credentials; see [Blockers](#blockers--whats-left) below.
- Testnet proof: [`docs/testnet-evidence.md`](docs/testnet-evidence.md) — real,
  confirmed Testnet transaction hashes for the full Noir lifecycle.
- Demo script / pitch notes: [`docs/demo-script.md`](docs/demo-script.md),
  [`docs/pitch.md`](docs/pitch.md).

## Problem

Government and NGO cash-assistance programs approve beneficiaries correctly but
lose time and trust in the *disbursement* step: manual bank transfers, unclear
status, no verifiable record of who got paid, when, or why a payment was held.
Eligibility review and payment execution get entangled, and funds often sit
idle in escrow with no transparent trigger for release.

## Solution

ABOT keeps eligibility human ("an admin approves a payout: recipient, amount,
due date") and makes *execution* autonomous and verifiable. A deterministic
agent — no LLM required — evaluates due payouts against an on-chain policy,
tops up funding through Velo when needed, authorizes the payment on Noir the
moment the contract's own rules allow it, and leaves a complete, queryable
audit trail. Nothing is marked successful without a confirmed Testnet
transaction behind it.

## Agentic flow

1. **Admin creates an approved payout** — recipient, amount, due date. Stored
   with a deterministic idempotency key so resubmission never double-creates it.
2. **Agent evaluates due payouts.** On a sweep (manual button or Vercel Cron),
   it atomically claims due, unlocked payouts (`FOR UPDATE SKIP LOCKED` — two
   concurrent sweeps can never grab the same one), allocates a stable
   per-device nonce, and asks Noir's own
   `checkPayment` whether authorization would succeed.
3. **Underfunded → Velo checkout.** If the contract says `insufficient_escrow`,
   the agent opens one Velo checkout session per payout (idempotency-keyed, so
   a re-run never opens a duplicate) and holds the payout as `needs_funding`.
4. **Velo payment confirmed via signed webhook** — verified against the raw
   body with `Velo.webhooks.verify`, deduped by `x-velo-delivery`. This funds
   ABOT's *operating balance*, not the Noir escrow directly.
5. **Organization funds Noir escrow separately** (a deliberate, logged action —
   Velo checkout does not auto-fund escrow; that's a different contract).
6. **Agent authorizes.** Once policy + escrow pass, it calls Noir's
   `authorizePayment` with its own server-held agent key and stored nonce. If
   the submission's outcome is uncertain (timeout, dropped response), the agent
   moves the payout to `manual_review`; Noir's public authorization event does
   not include the nonce needed to prove that a specific payout was submitted,
   so it never blindly retries.
7. **Recipient claims** through Noir's `claim` (`/claim/[payoutId]`). ABOT
   prepares the unsigned transaction, the recipient wallet signs it, and ABOT
   submits the signed XDR; no private key crosses the browser or server boundary.
8. **Every decision is persisted**: action, reason (the contract's own refusal
   name when applicable), and detail — visible on `/activity`.

## Architecture

npm workspaces monorepo:

```
apps/web           Next.js 15 (App Router) — UI + API routes, Supabase client,
                    auth gate, Noir/Velo service wiring
packages/agent      The decision engine: gateway interfaces, Noir/Velo service
                    wrappers, runAgentSweep(), idempotency key derivation
packages/shared     Types + exact stroops <-> decimal conversion (no floats)
supabase/           SQL schema: payouts, agent_decisions, funding_requests,
                    webhook_events; claim_due_payouts() does the atomic claim
docs/               Testnet evidence, demo script, pitch notes
```

The engine (`packages/agent/src/engine.ts`) depends only on narrow interfaces
(`PayoutGateway`, `FundingGateway`, `INoirService`, `IVeloService`), so its
unit tests run against in-memory fakes — no network, no DB — while
`apps/web/lib/repo-supabase.ts` is the real Postgres-backed implementation.

## Noir integration (`@noirx402/agent-sdk@0.3.0`)

Points at the **Week 4 contracts redeployed 2026-10-24** (the SDK's built-in
`TESTNET` config — `device_registry` `CAC4…QHU5`, `agent_registry`
`CCMZ…EBV`, `payment_escrow` `CC7E…BFS`). ABOT never deploys its own
contracts and never hardcodes a retired contract ID; it reads whatever the
SDK's `TESTNET` export points to.

`packages/agent/src/noir-service.ts` wraps the client with exactly the calls
the payout flow needs: `checkPayment` (asks the contract's own predicate, so
it can never disagree with what `authorize` will enforce), `authorizePayment`,
`getPendingBalance`, `claim`. The agent's Stellar secret key
(`AGENT_SECRET`) is read server-side only, via `keypairSigner`, and never
reaches the browser.

## Velo integration (`@carts1024/velo-sdk@alpha`)

Server-side only (`apps/web/lib/services.ts` → `packages/agent/src/velo-service.ts`).
`checkout.sessions.create` opens one top-up session per underfunded payout,
idempotency-keyed by payout id so re-running the sweep never duplicates a
session. The webhook route (`apps/web/app/api/webhooks/velo/route.ts`) reads
the **raw** request body, verifies it with `Velo.webhooks.verify` before
touching the payload, and dedupes by `x-velo-delivery` against the
`webhook_events` table (primary-key insert, `ON CONFLICT` is a no-op).

## Testnet proof

Full register → fund → authorize → claim lifecycle run against the live
2026-10-24 contracts, with confirmed, publicly resolvable transaction hashes:
see [`docs/testnet-evidence.md`](docs/testnet-evidence.md). Reproduce with
`node docs/scripts/testnet-smoke.mjs` against any two Friendbot-funded keys.

## Repo structure

```
apps/web/app/(admin)/{dashboard,payouts,activity,fund}   5 screens (+ landing, + /claim/[id])
apps/web/app/api/{payouts,agent,fund,webhooks}           API routes
packages/agent/src/{engine,decision,noir-service,velo-service,gateway,ports}.ts
packages/shared/src/{types,money}.ts
supabase/migrations/0001_init.sql
docs/{testnet-evidence,demo-script,pitch}.md
```

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in Supabase, Velo, and agent values
npx supabase start           # local Postgres via Docker; apply 0001_init.sql
npm run test                 # vitest — engine + idempotency + money, no network
npm run dev -w apps/web      # http://localhost:3000
```

## Environment variables

See [`.env.example`](.env.example) for the full list with descriptions:
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_API_TOKEN`, `CRON_SECRET`,
`AGENT_SECRET`, `AGENT_PUBLIC_KEY`, `ORG_DEVICE_HASH`, `NOIR_RPC_URL`,
`VELO_API_KEY`, `VELO_WEBHOOK_SECRET`, `VELO_ENVIRONMENT`, `VELO_BASE_URL`,
`VELO_FUNDING_ASSET`, `NEXT_PUBLIC_APP_URL`.

## Blockers / what's left

This execution environment has no Supabase project, Vercel account, or Velo
API key configured, so the following are implemented and tested but not yet
exercised against hosted infrastructure:

- **Supabase**: schema is written and the query layer is typed against it
  (`apps/web/lib/database.types.ts`), but there's no hosted project to run
  `supabase db push` against, and the local Docker stack couldn't verify it
  here because Docker Desktop's engine wasn't running. Create a project,
  run the migration in `supabase/migrations/0001_init.sql`, and fill in
  `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`.
- **Velo**: integration code, signed webhook checks, retrieved-intent status
  verification, and amount/asset correlation are complete, but creating a real
  checkout session needs a `VELO_API_KEY` from a Velo project dashboard, which
  this environment doesn't have.
- **Deploy**: no Vercel token available to `vercel deploy` from here. Repo
  is ready to deploy as-is (`vercel.json` includes the Cron Job for the
  agent sweep) once linked to a Vercel project with the env vars above.
- **Screenshots**: pending a deployed/running instance to capture from.

The decision engine, state machine, idempotency and concurrency protections,
and Noir Testnet integration are implemented; hosted database, Velo checkout,
and deployment verification remain environment-dependent.

## Next steps

- Update `/claim/[id]` to obtain a wallet-signed XDR and POST `{ signedTxXdr }`.
- Map Velo's settled fiat/stablecoin amount to an explicit "ready to fund
  escrow" admin action, rather than leaving that link manual.
- Replace the single `ADMIN_API_TOKEN` bearer check with Supabase Auth +
  row-level security once there's a real user base of caseworkers.

## Credits

Built for the hackathon using `@noirx402/agent-sdk` (Noir) and
`@carts1024/velo-sdk` (Velo) on Stellar Testnet.
