# ABOT video production handoff

## Deliverable

- `video/deliverables/ABOT_Hackathon_Demo_120s.mp4`
- `video/` contains the Remotion source, procedural audio generator, package lock, and render scripts.
- Format: H.264 MP4, 1920x1080, 30 FPS, AAC stereo, 48 kHz.
- Duration: exactly 120.000 seconds / 3,600 frames.

## Timeline

- 00:00–00:10: approval-to-delivery gap and stopped payment signal.
- 00:10–00:25: accountability friction infographic.
- 00:25–00:37: ABOT mark reveal.
- 00:37–00:53: separate Noir payout and Velo operating-balance lanes.
- 00:53–01:17: Demo Mode product journey, including payout-demo-5, Pending → Authorized, simulated=true, Manual Review, Needs Funding, and Reset Demo.
- 01:17–01:32: bounded decision gates and allow/hold/manual review outcomes.
- 01:32–01:47: standalone Noir Testnet lifecycle proof.
- 01:47–01:54: Velo boundary and honest non-settlement label.
- 01:54–02:00: ABOT finale.

## Evidence boundary

The five transaction hash excerpts in the film come only from `docs/testnet-evidence.md`:

1. `device_registry.register_device`
2. `agent_registry.register_agent`
3. `payment_escrow.fund_escrow`
4. `payment_escrow.authorize`
5. `payment_escrow.claim`

The film labels these as **REAL STELLAR TESTNET TRANSACTIONS** and **STANDALONE NOIR SDK VERIFICATION**. It explicitly states that they are not a payout executed through the deployed ABOT interface.

The product panel is a verified UI-copy recreation based on the deployed page's observed public/demo text. Browser automation stopped at the environment boundary, so this render does not claim a live browser screenshot or new live interaction test. Simulated product states remain labeled as Demo Mode and no blockchain transaction.

For Velo, the film claims only the documented integration boundary: checkout/webhook separation and fail-closed handling of unsigned or synthetic webhook input. It does not claim a paid settlement.

## Validation run

From `video/`:

```text
npm run audio
npm run check
npm run render:sample
npm run render
ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate,avg_frame_rate,sample_rate,channels -of json deliverables/ABOT_Hackathon_Demo_120s.mp4
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of default=nw=1 deliverables/ABOT_Hackathon_Demo_120s.mp4
```

Observed final output: 120.000000 seconds, 3,600 video frames, 1920x1080, 30/1 FPS, H.264, AAC stereo at 48 kHz, 6.9 MB.

## Safety

No private keys, wallet secrets, API tokens, service-role keys, or Velo secrets are included. The soundtrack is generated locally by `scripts/generate-audio.mjs`; there is no voiceover or commercial music.
