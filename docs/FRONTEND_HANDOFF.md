# ABOT frontend handoff

## COMPLETED

- Premium public landing page for `abot.` with original network/arrival visual, responsive navigation, concise civic-fintech copy, trust section, payment journey, and footer.
- Responsive operator shell with mobile drawer, status badge, loading state, demo/live banner, and real route links.
- Dashboard, payout queue, agent activity, funding center, recipient claim, help/onboarding, sign-in boundary, and funding result pages.
- DEMO MODE is deterministic and labeled; a stored admin token switches requests to the real API boundary.

## DESIGN SYSTEM

- Tokens: Deep Ink `#0B1724`, Emerald `#087F65`, Mint `#47D7AA`, Warm White `#F6F9F7`, Mist `#DDE8E2`, Amber `#E4A94F`.
- Typography: Inter via `next/font`; compact editorial display scale, uppercase operational labels, high-contrast buttons, 44px+ touch targets.
- Brand assets: `apps/web/components/brand.tsx` and `apps/web/app/icon.svg`. The symbol uses connected geometric nodes to represent approval, execution, and arrival.

## ROUTES

- `/` landing
- `/dashboard` overview and first-time onboarding tour
- `/payouts` searchable/filterable queue and create/requeue controls
- `/activity` expandable agent decision audit trail
- `/fund` Velo funding center with explicit Noir escrow separation
- `/claim/[id]` wallet-signed claim preparation and submission
- `/help` terminology, Testnet boundary, and tutorial replay
- `/sign-in` honest authentication boundary; no fake session

## MOTION / 3D

- `apps/web/components/network-scene.tsx` is an authored SVG depth/network composition with deliberate signal propagation, node labels, and reduced-motion compatibility through global CSS.
- CSS motion covers signal flow, subtle agent status pulse, hover/focus feedback, loading state, and onboarding transitions.
- No Three.js dependency was added: the existing project had no R3F/Drei stack, and the SVG implementation avoids WebGL startup, device-specific failures, and layout shifts while keeping the hero lightweight.

## ONBOARDING

- `OnboardingTour` targets real dashboard regions with `data-tour` attributes: metrics, payout queue, agent, funding, journey, and audit trail.
- Seven steps support Next, Previous, Skip, Finish, Escape, progress, responsive placement, and `localStorage` completion persistence.
- Help page replays the tour by clearing `abot_onboarding_complete`.

## AUTHENTICATION UI STATUS

- Existing bearer-token backend authorization is preserved behind a short-lived HttpOnly admin session bridge; the browser does not persist `ADMIN_API_TOKEN` in localStorage.
- `/sign-in` explains the current token-based integration without pretending Supabase/Auth session state exists. Public DEMO MODE is read-only.
- No private key, recovery phrase, service-role secret, or provider secret is requested by the frontend.

## DEMO / LIVE DATA BOUNDARIES

- `apps/web/lib/api-client.ts` is the centralized client boundary.
- No admin session + `NEXT_PUBLIC_ABOT_DEMO_MODE !== "false"` => deterministic read-only DEMO MODE fixtures, visibly labeled as non-live and non-proof.
- Admin session present => frontend requests go through the server-side session proxy and existing `/api/...` routes receive bearer authorization.
- Claim demo responses explicitly say no chain proof; live claim uses the backend's `{ signedTxXdr }` contract.

## API DEPENDENCY MAP

- `GET /api/payouts`, `POST /api/payouts`
- `GET /api/agent/activity`, `POST /api/agent/run`
- `GET /api/fund`, `POST /api/fund`
- `POST /api/payouts/:id/requeue` with human confirmation
- `GET /api/payouts/:id/claim/prepare?source=<recipient-public-key>`
- `POST /api/payouts/:id/claim` with `{ signedTxXdr }`

## WALLET-SIGNED CLAIM STATUS

- Wired to the documented two-step flow: enter approved public key, fetch unsigned XDR, sign in a wallet, submit signed XDR, render returned transaction reference.
- The UI never asks for private keys and does not blind-retry failures.

## VERIFIED QA

- `npm run typecheck` — PASS.
- `npm run build` — PASS; 18 application routes generated.
- Brave against the local production server — PASS for landing, desktop dashboard, DEMO MODE fixtures, onboarding Next/Skip, payout queue navigation/table, and recipient claim Prepare → Sign → Complete demo feedback.
- Responsive observation — PASS at the available ~942px browser window; the OS/browser launch did not honor the requested 390px window size, so exact 320/375/390/430px viewport checks remain NOT TESTED.
- Reduced-motion CSS fallback and keyboard-visible focus styles are implemented; OS-level reduced-motion and full keyboard audit were not separately exercised.

## REMAINING BACKEND WIRING

- Provide the configured admin bearer token and provider environment to switch from DEMO MODE to live API behavior.
- Connect a recipient wallet signer in the host product for the unsigned XDR step; the current UI intentionally provides a safe manual signed-XDR boundary.
- Revalidate real provider/browser behavior after the backend worktree is merged; this frontend does not claim production, Velo settlement, Supabase auth, or on-chain proof from demo data.
