# ABOT architecture

```mermaid
flowchart LR
  operator[Operator browser] --> session[HttpOnly admin session bridge]
  session --> api[Next.js API routes]
  api --> db[(Supabase Postgres)]
  api --> engine[Deterministic agent engine]
  engine --> noir[Noir Testnet SDK]
  engine --> velo[Velo SDK]
  recipient[Recipient wallet] -->|signed XDR| claim[Claim route]
  claim --> noir
  api --> audit[Decision and webhook audit records]
```

## Boundaries

- Public visitors see clearly labeled, read-only deterministic DEMO MODE.
- Admin actions require a short-lived HttpOnly session validated against the
  existing `ADMIN_API_TOKEN` bearer boundary; the token is not stored in
  localStorage or shipped as a public build value.
- `SUPABASE_SERVICE_ROLE_KEY`, `AGENT_SECRET`, `VELO_API_KEY`, and
  `VELO_WEBHOOK_SECRET` stay server-only.
- Velo operating-balance funding and Noir escrow funding are separate actions.
- Recipient claims use wallet-signed XDR; private keys never cross ABOT.
- Testnet transaction evidence is documented in
  [`docs/testnet-evidence.md`](testnet-evidence.md).
