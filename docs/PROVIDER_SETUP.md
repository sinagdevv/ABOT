# ABOT provider setup

Do not paste secret values into chat, commits, screenshots, or issue comments.

## Supabase

1. Create a project in the intended environment.
2. Link the repository with the Supabase CLI.
3. Run `supabase db push` to apply `supabase/migrations/0001_init.sql`.
4. Copy the project URL to `SUPABASE_URL` and the server-only service-role key to `SUPABASE_SERVICE_ROLE_KEY`.
5. Verify RLS is enabled on `payouts`, `agent_decisions`, `funding_requests`, `webhook_events`, and `payout_nonce_sequences`; the app uses the service-role client only from server routes.
6. Create one approved Testnet device/escrow policy and set its 64-hex device hash in `ORG_DEVICE_HASH`.

## Noir Testnet

1. Generate a dedicated Testnet agent keypair and set its secret only as `AGENT_SECRET`.
2. Set the corresponding public key as `AGENT_PUBLIC_KEY`.
3. Use the official SDK's built-in Testnet contract configuration; do not deploy or hardcode retired contract IDs.
4. Register the device and agent policy, fund escrow separately, and record the confirmed hashes outside source control.
5. Set `NOIR_RPC_URL` only when an approved RPC override is required.

## Velo

1. Create/select the Velo Testnet project.
2. Set its API key as `VELO_API_KEY`, webhook signing secret as `VELO_WEBHOOK_SECRET`, and `VELO_ENVIRONMENT=testnet`.
3. Set `VELO_FUNDING_ASSET` to the asset accepted by the project and set `VELO_BASE_URL` only for a provider-approved endpoint.
4. Configure the webhook URL as `<APP_URL>/api/webhooks/velo`.
5. Create a checkout through `POST /api/fund` with an admin bearer token.
6. Confirm the signed `payment.succeeded` webhook is accepted only when the retrieved intent is `paid` and its amount/asset match a stored funding request.
7. Confirm that the Velo request is marked paid but the Noir escrow remains a separate, explicit funding operation.

## App and Vercel

Set `ADMIN_API_TOKEN` to a long random value, `CRON_SECRET` to a separate random value, and `NEXT_PUBLIC_APP_URL` to the deployed origin. Add all server secrets to the Vercel environment store, never to `NEXT_PUBLIC_*`. Configure the existing `/api/agent/run` cron from `vercel.json`.

Before calling the deployment ready, verify anonymously that protected admin routes return `401`, then perform authenticated payout creation, a no-funds hold, an escrow-funded Testnet authorization, and a recipient claim. A Vercel `READY` build alone is not runtime or provider proof.
