# ABOT cinematic video handoff

## Delivered artifact

- `deliverables/ABOT_Cinematic_Demo.mp4`
- 120.000 seconds, 1920×1080, 16:9, 30/1 FPS
- H.264 video, AAC 48 kHz stereo audio
- Rendered with Remotion 4.0.541 and the bundled FFmpeg toolchain
- Contact sheet: `deliverables/ABOT_Cinematic_Demo_contact-sheet.jpg`

## Production source

- `video/src/ABOTFilm.tsx` — deterministic eight-scene composition and reusable motion components
- `video/src/index.tsx` — 3,600-frame composition definition
- `video/src/remotion-root.tsx` — Remotion entry point
- `video/scripts/generate-audio.mjs` — deterministic original 120-second stereo soundtrack generator
- `video/package.json` / `video/pnpm-lock.yaml` — isolated video package

The soundtrack is procedural and original to this production: atmospheric pad, restrained pulse, transaction clicks, confirmation shimmer, and a final resolving bed. There is no voiceover, narration, talking head, watermark, or licensed third-party music.

## Narrative coverage

The film follows the requested timing exactly:

| Time | Scene | Evidence boundary |
|---|---|---|
| 00:00–00:12 | Problem | Animated payment path stops at funding, policy, and manual gates |
| 00:12–00:25 | ABOT reveal | Existing ABOT mark and tagline |
| 00:25–00:42 | Agent architecture | Approval → agent → Noir policy → escrow → recipient, with review branch |
| 00:42–01:14 | Application surface | Deterministic demo-mode product plate with JR / 5 XLM / pending → authorized |
| 01:14–01:34 | Testnet evidence | The five hashes and ledgers from `docs/testnet-evidence.md` |
| 01:34–01:49 | Velo × Noir | Separate operating-balance and escrow-authorization lanes |
| 01:49–01:56 | Impact | Arrival and three bounded impact phrases |
| 01:56–02:00 | End card | ABOT mark, tagline, website, repository |

## Provenance and limits

The application sequence is explicitly marked `SIMULATED DEMO · NO ON-CHAIN TRANSACTION`. The browser automation surface was unavailable in this environment: the CUA browser helper timed out twice and the deployed URL was not reachable through the available web reader. Therefore the application scene is a deterministic motion plate authored from the verified ABOT demo data and UI copy in `apps/web/lib/api-client.ts`, `apps/web/app/(admin)/*`, and `docs/demo-script.md`; it is not claimed as live browser footage.

The evidence scene is separate and truthful. It uses the genuine five confirmed Stellar Testnet transaction hashes and ledger numbers in `docs/testnet-evidence.md`, and states that the run was standalone Noir SDK execution—not a deployed ABOT website payout. No deployed authorization success, Velo settlement, or recipient-wallet settlement is claimed.

## Validation

- `pnpm run check` in `video/` — PASS
- Remotion composition listing — PASS (`ABOTCinematic`, 1920×1080, 30 FPS, 3,600 frames)
- FFprobe — PASS: 120.000000 seconds; H.264 1920×1080 at 30/1; AAC 48 kHz, 2 channels
- Full export — PASS: `deliverables/ABOT_Cinematic_Demo.mp4` exists, 16,986,744 bytes at QA time
- Representative-frame contact sheet — PASS: opening, reveal, architecture, app surface, evidence, split lanes, impact, and end card sampled

## Git boundary

Only video source and this handoff should be committed and pushed from this worktree. The MP4, preview, contact sheet, generated WAV, and package-manager caches are local artifacts and are ignored where appropriate.
