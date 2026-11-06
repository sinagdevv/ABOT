# ABOT backend handoff

Status: backend changes are implemented on `feat/abot-hackathon-mvp`. Supabase `0002` and a live Velo Testnet checkout have been exercised; Vercel deployment and Velo settlement remain pending.

Current local app configuration is not deployable until real `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` values replace the detected placeholders; the runtime now fails closed on those placeholders.

## Architecture

- `apps/web/app/api` contains the server-only API routes.
- `packages/agent` contains the deterministic sweep engine and narrow Noir/Velo ports.
- `apps/web/lib/repo-supabase.ts` is the service-role storage adapter. The service-role key is never imported by client components.
- `supabase/migrations/0001_init.sql` is the original schema. `supabase/migrations/0002_backend_hardening.sql` adds immutable approvals, leases, stable per-device nonces, explicit transitions, manual review, and restricted RPC/table access.

No database transaction is held across a Noir or Velo call. A worker claim stores a UUID lease and expiry. An expired `authorizing` lease is moved to `manual_review`; it is not retried because Noir's public authorization event does not expose the authorization nonce needed to prove that a particular payout was submitted.

## Environment variables

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_API_TOKEN`, `CRON_SECRET`, `AGENT_SECRET`, `AGENT_PUBLIC_KEY`, `ORG_DEVICE_HASH`, `NOIR_RPC_URL`, `VELO_API_KEY`, `VELO_WEBHOOK_SECRET`, `VELO_ENVIRONMENT`, `VELO_BASE_URL`, `VELO_FUNDING_ASSET`, `NEXT_PUBLIC_APP_URL`.

Next/Vercel runs with `apps/web` as the project root, so use `apps/web/.env.local` locally; the repository-root `.env.local` is not loaded by that Next process. Values belong in the provider's secret store for Vercel. Never send `SUPABASE_SERVICE_ROLE_KEY`, `AGENT_SECRET`, `VELO_API_KEY`, or `VELO_WEBHOOK_SECRET` to the browser. Placeholder values are rejected at runtime.

## Database setup

1. Create a Supabase project and install the Supabase CLI.
2. Link the project without putting credentials in chat or source control.
3. For the existing manually applied database, record `0001` without executing it: `supabase migration repair --remote=<db-url> --status applied 0001`.
4. Preview and apply only `0002_backend_hardening.sql` with `supabase db push --remote=<db-url> --dry-run`, then `supabase db push --remote=<db-url>`.
5. Confirm the lease/nonce columns and table, RLS-enabled server tables, three-argument `claim_due_payouts`, and `reserve_authorization_nonce`.
6. Set the server environment variables and run the API smoke checks.

The live migration apply was verified against the configured Supabase project; no separate transactional PostgreSQL integration suite was run.

## API contract

All admin and agent routes require `Authorization: Bearer <ADMIN_API_TOKEN>`. The cron path for `GET`/`POST /api/agent/run` also accepts `CRON_SECRET`. Invalid or missing configuration fails closed.

- `GET /api/payouts` → `{ payouts: Payout[] }` (amounts are decimal strings; lease fields are omitted).
- `POST /api/payouts` with `{ recipientName, recipientAddress, amount, asset, dueAt, deviceHash? }` → `201 { payout }`. The recipient is validated as a Stellar public key, amount is converted to bigint stroops, and the deterministic idempotency key is inserted without overwriting an existing payout.
- `POST /api/agent/run` or `GET /api/agent/run` → `{ results: [{ payoutId, action }] }`.
- `GET /api/agent/activity` → `{ decisions }`.
- `POST /api/payouts/:id/requeue` → `{ ok: true }`; only `failed` and `manual_review` rows can be requeued.
- `POST /api/fund` with `{ amount }` → `{ checkoutUrl, paymentIntentId }`; admin only.
- `GET /api/fund` → `{ fundingRequests }`; admin only.
- `POST /api/webhooks/velo` accepts the raw signed Velo body. It verifies the signature, retrieves the payment intent, requires `paid`, matches amount and asset to a pending funding request, and deduplicates the delivery/event id.
- `GET /api/payouts/:id/claim/prepare?source=<recipient-public-key>` returns `{ unsignedTxXdr }` for an authorized payout after matching the source to the approved recipient.
- `POST /api/payouts/:id/claim` accepts `{ signedTxXdr }` from a recipient wallet, validates the transaction source against the approved recipient, and submits it to Noir. No private key crosses the browser or server boundary.

## Payout state machine

```text
pending ───────────────> authorizing ───────> authorized ───────> claimed
   │                          │  │  │
   │                          │  │  └───────> failed ───────> pending
   │                          │  └──────────> manual_review ─> pending
   │                          └─────────────> needs_funding ─> authorizing
   └────────────────────────────────────────> cancelled
```

Approval identity, beneficiary, asset, amount, and due date are immutable. Updates use compare-and-swap status plus lease token. A second worker cannot complete or fail another worker's lease.

## Agent lifecycle

1. PostgreSQL atomically selects due `pending`/`needs_funding` rows with `FOR UPDATE SKIP LOCKED`, allocates a stable per-device nonce, and sets a lease.
2. The agent calls Noir `checkPayment` with bigint stroops, device hash, server-held agent public key, asset, and amount.
3. `insufficient_escrow` creates one idempotent Velo funding request and returns the payout to `needs_funding`. Other refusals return to `pending` with an audit decision.
4. A passing check calls Noir `authorizePayment` with the stored nonce. A successful SDK response stores the transaction hash and nonce before releasing the lease.
5. Any uncertain authorization submission goes to `manual_review`; the engine never retries from a balance delta.
6. A recipient claims the authorized payment. Velo funding remains separate from Noir escrow funding; a paid Velo request never marks a payout authorized.

## Noir and Velo boundaries

`NoirService` uses `NoirAgentClient.checkPayment`, `authorizePayment`, `getPendingBalance`, `getEscrowBalance`, and `claim` against the SDK's configured Testnet network. Registration and escrow funding are deliberate owner-side operations and are not exposed as arbitrary public API calls. The existing live Testnet lifecycle evidence remains in `docs/testnet-evidence.md`.

`VeloService` uses `checkout.sessions.create` with an idempotency key per payout and `paymentIntents.retrieve` during webhook verification. Credentials are server-only. A Velo payment is an operating-balance confirmation, not proof that a Noir escrow deposit occurred.

## Verification boundary

- TypeScript: run `npm run typecheck`.
- Unit tests: run `npm test`.
- Production build: run `npm run build` from the repository root or Vercel with Root Directory `apps/web`.
- PostgreSQL/Supabase: `0002` is applied and verified against the configured project; existing row count was zero before apply.
- Velo checkout: the live Testnet API accepted an in-house checkout through the installed SDK; the authenticated app route could not complete its Supabase insert because the local Supabase URL/key were placeholders. Payment settlement/webhook delivery was not exercised.
- Noir Testnet: SDK contract IDs, live policy/check, and all five recorded Horizon transactions were revalidated read-only; no new payment was submitted.

## Claude's UI integration notes

Keep the existing admin calls and render the new `manual_review` status as a blocked/manual state. Do not display lease fields. Requeue only after a human confirms the external payment outcome. Update the claim form to fetch the unsigned XDR, sign it with a wallet, and POST `{ signedTxXdr }`.
