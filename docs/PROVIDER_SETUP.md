# ABOT provider setup

Do not paste secret values into chat, commits, screenshots, or issue comments.

## Supabase

1. Create a project in the intended environment.
2. Link the repository with the Supabase CLI.
3. Because `0001_init.sql` was manually applied, record it without rerunning SQL: `supabase migration repair --remote=<db-url> --status applied 0001`.
4. Run `supabase db push --remote=<db-url> --dry-run`, confirm only `0002_backend_hardening.sql` is listed, then run `supabase db push --remote=<db-url>`.
5. Copy the project URL to `SUPABASE_URL` and the server-only service-role key to `SUPABASE_SERVICE_ROLE_KEY`.
6. Verify RLS is enabled on `payouts`, `agent_decisions`, `funding_requests`, `webhook_events`, and `payout_nonce_sequences`; anon/authenticated have no table privileges; the app uses the service-role client only from server routes.
7. Create one approved Testnet device/escrow policy and set its 64-hex device hash in `ORG_DEVICE_HASH`.

## Noir Testnet

1. Generate a dedicated Testnet agent keypair and set its secret only as `AGENT_SECRET`.
2. Set the corresponding public key as `AGENT_PUBLIC_KEY`.
3. Use the official SDK's built-in Testnet contract configuration; do not deploy or hardcode retired contract IDs.
4. Register the device and agent policy, fund escrow separately, and record the confirmed hashes outside source control.
5. Set `NOIR_RPC_URL` only when an approved RPC override is required.

## Velo

1. Create/select the Velo Testnet project.
2. Set its API key as `VELO_API_KEY`, webhook signing secret as `VELO_WEBHOOK_SECRET`, and `VELO_ENVIRONMENT=testnet`.
3. Set `VELO_FUNDING_ASSET` to the asset accepted by the project and set `VELO_BASE_URL` only for a provider-approved endpoint. ABOT explicitly requests the `inhouse` anchor and sends a payout correlation ID.
4. Configure the webhook URL as `<APP_URL>/api/webhooks/velo`.
5. Create a checkout through `POST /api/fund` with an admin bearer token.
6. Confirm the signed `payment.succeeded` webhook is accepted only when the retrieved intent is `paid` and its amount/asset match a stored funding request.
7. Confirm that the Velo request is marked paid but the Noir escrow remains a separate, explicit funding operation.

## App and Vercel

For local Next runs, place the variables in `apps/web/.env.local`; the root `.env.local` is not loaded when Next runs from `apps/web`. Use real values, not the placeholders in `.env.example`.

In Vercel set Root Directory to `apps/web`, Framework Preset to Next.js, and Build Command to `npm run build`. Add these Production/Preview variables as appropriate: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_API_TOKEN`, `CRON_SECRET`, `AGENT_SECRET`, `AGENT_PUBLIC_KEY`, `ORG_DEVICE_HASH`, `NOIR_RPC_URL`, `VELO_API_KEY`, `VELO_WEBHOOK_SECRET`, `VELO_ENVIRONMENT`, `VELO_BASE_URL`, `VELO_FUNDING_ASSET`, and `NEXT_PUBLIC_APP_URL`. Do not add service-role, agent, or Velo secrets under `NEXT_PUBLIC_*`. Automatic Vercel cron is intentionally removed for the Hobby plan; use the secured manual `POST /api/agent/run` trigger or an external daily scheduler with `CRON_SECRET`.

Before calling the deployment ready, verify anonymously that protected admin routes return `401`, then perform authenticated payout creation, a no-funds hold, an escrow-funded Testnet authorization, and a recipient claim. A Vercel `READY` build alone is not runtime or provider proof.
