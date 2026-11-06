# Testnet proof

Live, verifiable run against Noir's real **Week 4 contracts, redeployed 2026-10-24**
(the IDs built into `@noirx402/agent-sdk@0.3.0`'s `TESTNET` config), executed through
the exact same `NoirAgentClient` calls `packages/agent` uses. Every hash below
resolves on public Testnet Horizon — e.g.
`https://horizon-testnet.stellar.org/transactions/<hash>`.

Run on 2026-11-06 with two throwaway Testnet keypairs generated for this check
(no production secrets involved) and funded via Stellar's public Friendbot.

| Field | Value |
|---|---|
| Device hash | `cf7affb214605b6a41e9cf4cdc51b3ddc694bd73d165a6cdbe9a1bf54af3cf0d` |
| Owner / agent key | `GBXLMKZJPANMYXNRPOJ2VY74ERGVOKUTLFVW4XBGKFXVO33CHSHFYX5R` |
| Merchant (recipient) key | `GATG3ZLXHQZ3H4COYSWN2RFODQKXUS2JKJJ5I7GSAHSJU7P35U23ESRA` |
| Asset (native XLM SAC on Testnet) | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |

| Step | Contract call | Tx hash |
|---|---|---|
| 1. Link device to owner | `device_registry.register_device` | `d29ffdde5326e049947520542b6fbba9881f1c0417d246d1f155a761f5f15c1e` |
| 2. Grant agent policy (50 XLM cap, 24h) | `agent_registry.register_agent` | `67ce08626801293464cb308af8eaad336ea73b848a26ab16e502b3e31a09d4ae` |
| 3. Fund escrow (20 XLM) | `payment_escrow.fund_escrow` | `dfac27a134dcb599345be1a7f9fa8d9fc24fc4360340d91eb7391bd803ce3d31` |
| 4. Agent authorizes payment (5 XLM to merchant) | `payment_escrow.authorize` | `6b752fc1068b5d1d13e73769fdf26f41cd6715f1f3e4d5ab888127e223c212b8` |
| 5. Merchant claims | `payment_escrow.claim` | `e02ee6557edf0cd35bef37b368922ef901021713341576100a54c61ca200f434` |

Confirmed on Horizon for step 4 (representative — all five resolve the same way):

```json
{
  "successful": true,
  "hash": "6b752fc1068b5d1d13e73769fdf26f41cd6715f1f3e4d5ab888127e223c212b8",
  "ledger": 5585520,
  "created_at": "2026-11-06T07:47:21Z",
  "source_account": "GBXLMKZJPANMYXNRPOJ2VY74ERGVOKUTLFVW4XBGKFXVO33CHSHFYX5R"
}
```

Also exercised, matching what the agent's decision engine branches on:

- `checkPayment` for 5 XLM against the policy above → `{ "ok": true }`, then authorized.
- `checkPayment` for 100 XLM (over the 50 XLM cap) → `{ "ok": false, "reason": "over_limit" }`,
  which the engine maps to `hold_over_limit` and leaves the payout `pending` for a human to review.
- Escrow balance read back as exactly `20 XLM` after funding, `fromStroops`/`toStroops`
  round-tripping with no floating point at any step.

## What this does and does not prove

Proves: the full Noir lifecycle ABOT's agent drives — register → fund → policy-check →
authorize → claim — works against the real, currently-deployed Testnet contracts, with
real confirmed transaction hashes, using the same SDK calls `packages/agent/src/noir-service.ts`
makes.

Does not prove: the Velo checkout leg, which needs a live `VELO_API_KEY` this environment
doesn't have (see `README.md` → Blockers). Velo's webhook signature verification is covered
instead by unit tests against the SDK's own `Velo.webhooks.verify`, since that needs no API key.

Reproduce with `node docs/scripts/testnet-smoke.mjs` (same script, kept here for anyone who
wants to re-run it against fresh Friendbot-funded keys).
