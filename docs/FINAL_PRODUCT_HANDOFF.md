# ABOT final product handoff

## Implemented

- Reframed the public experience around connection, authorization, and arrival.
- Added a skippable first-visit cinematic intro with an SVG/CSS brand-film fallback, reduced-motion bypass, local completion state, and Settings replay.
- Rebuilt the landing page with the ABOT journey, Velo/Noir separation, constrained-agent story, product preview, Testnet disclaimer, and responsive footer.
- Added `/settings` for account/session state, motion preferences, intro/tutorial replay, safe Demo reset, integration boundaries, and About.
- Demo Mode now supports simulated payout creation, simulated agent evaluation, resettable fixtures, and explicit `SIMULATED — NO BLOCKCHAIN TRANSACTION` labeling.
- Live mode remains behind the existing server-side bearer-token boundary and HttpOnly session cookie. The token is not stored in localStorage or shipped to the client bundle.
- Added Settings navigation, truthful Demo/Live status language, and removed the permanent token-entry panel from the sidebar.

## Authentication architecture

The current backend exposes an operator bearer-token boundary, not Supabase email/password provisioning. The frontend keeps that boundary honest: Demo is public; Live Testnet requires the existing operator token, exchanged for a short-lived HttpOnly cookie. No public self-registration or fake authenticated session was added.

## Demo / Live architecture

`apps/web/lib/api-client.ts` is the shared boundary. Demo responses are deterministic in-memory fixtures and never call Supabase, Velo, or Noir. Live requests route through `/api/admin/proxy` and the existing protected handlers. `resetDemoData()` restores only demo fixtures.

## Intro, motion, and assets

- `apps/web/components/cinematic-intro.tsx` — first-visit intro, Skip Intro, reduced motion, replay event.
- `apps/web/components/brand.tsx` — reusable ABOT symbol and wordmark.
- `apps/web/components/network-scene.tsx` — authored SVG network hero; no server-side WebGL dependency.
- `apps/web/app/globals.css` — tokens, focus states, motion, intro choreography, and responsive behavior.

The hero uses SVG/CSS as the resilient path to preserve accessibility and performance. No Three.js runtime was added because the current product did not need a GPU dependency to deliver the authored connection metaphor.

## Frontend/backend map

- Payouts: `/api/payouts`, `/api/payouts/:id/requeue`.
- Agent: `/api/agent/activity`, `/api/agent/run`.
- Funding: `/api/fund` and `/api/webhooks/velo`.
- Claims: `/api/payouts/:id/claim/prepare` and `/api/payouts/:id/claim`.
- Server authorization, state machine, idempotency, Noir, Velo, Supabase, and migrations were not changed.

## QA and performance

- `npm test`: 14 tests passed.
- `npm run typecheck`: passed for web, agent, and shared packages.
- `npm run build`: passed; 21 routes generated.
- Local HTTP smoke checks returned 200 for `/`, `/settings`, `/sign-in`, `/dashboard`, `/payouts`, `/activity`, `/fund`, and `/help`.
- Browser automation was unavailable in this environment (`browser access host is unavailable`), so visual viewport and interaction QA remain unverified here.
- No ESLint script exists in the repository; Next production build completed its compile/type validation.

## Deployment status

Commit `605f107` is pushed to `feat/abot-hackathon-mvp` and deployed to the existing Vercel project. Production returned `READY` and is aliased at `https://abot-web.vercel.app`. Anonymous HEAD/HTML checks returned 200 for `/`, `/settings`, and `/sign-in`; the project reports Vercel deployment protection enabled in metadata. Server-only environment variables and `NEXT_PUBLIC_APP_URL` remain Vercel-managed.

## Known limitations

- Supabase email/password auth is not implemented because the current backend has no compatible user-session route or role provisioning. Operator access remains token-gated and truthful.
- Wallet adapters are not invented; recipient claims use the existing unsigned-XDR / signed-XDR boundary and clearly require an external Testnet wallet.
- Velo live checkout, Supabase live reads, and authenticated production runtime were not exercised in this local QA pass.

## Hackathon demo instructions

1. Open `/` and let the intro play or select Skip Intro.
2. Choose Explore demo and open `/payouts`.
3. Create a simulated payout; the banner explicitly states no blockchain transaction occurs.
4. Return to Dashboard and select Simulate evaluation.
5. Inspect Agent activity and the payment journey.
6. Use Settings → Reset Demo to restore fixtures.
7. Use Enter Live Testnet only with the configured operator token; do not use a wallet recovery phrase or private key.
