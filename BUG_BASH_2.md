# Bug-bash report — P0 stream/VOD/clip/embed walkthrough · 2026-05-16

Followup walkthrough after Phase 2 leftovers shipped. Driven by Claude-in-Chrome web smoke tests against `http://localhost:8081` (Expo web) backed by production `https://evo-tv.vercel.app`.

## Summary

| # | Severity | Area | Status |
|---|----------|------|--------|
| 1 | P0 | Stream detail — wide-viewport layout collapses title + chat | OPEN |
| 2 | P0 | ClipDetailScreen crash: `findIndex` on envelope object | FIXED (commit 57a4a44) |
| 3 | P1 | Discover/Home cards missing thumbnails (black squares) | OPEN |
| 4 | P1 | Stale VOD IDs in discover list cause 404 on click | OPEN |
| 5 | INFO | Stream player shows black video — expected (no RTMP ingest) | N/A |
| 6 | P1 | Product detail blank image area (thumbnail gap spreads) | OPEN |
| 7 | P1 | Esports-only copy on signup/onboarding/upgrade/channel/events | OPEN |
| 8 | P0 | EventDetail crashes — 5 patterns on nullable backend fields | FIXED (commit 0936c58) |
| 9 | P0 | EventHero "Invalid Date" + empty banner + null fields | FIXED (commit 0936c58) |
| 10 | P1 | `/c/[slug]` 404 state too bare (just plain text) | OPEN |
| 11 | P1 | Multi-stream + watch-parties hardcode SAMPLE_HLS | OPEN |
| 12 | P0 | Pickem round-grouping crashes on unknown round value | OPEN |
| 13 | P1 | Engagement screens have date-format crashes (same pattern as #8) | OPEN |
| 14 | P1 | Pickem leaderboard always shows "0 of 0 correct" | OPEN |
| 15 | P2 | Fantasy is 100% mock — Phase 1A gap | LOGGED |
| 16 | P1 | Email verification flow is UI-only (no backend wire) | LOGGED (task #16) |

## Detail

### Bug #1 — Stream page on wide-web viewport (P0)
- Path: `/stream/[id]`
- Symptom: At ≥1024px width, `<HLSPlayer />` is constrained to `aspectRatio: 16/9` only. Renders at 1077px × ~605px → consumes ~93% of 648px viewport. Title, streamer info, chat, About tab are all rendered but pushed off-screen behind tab bar.
- Mobile (412px width): renders correctly with title + tabs + chat below player.
- Fix path: Wrap player in a max-width container (e.g. `max-w-3xl` ≈ 768px) on web, OR split layout to side-by-side (player | chat) at `≥md` breakpoint similar to Twitch/YouTube. Skip aspect-ratio enforcement on wide layouts and let chat panel claim half the screen.

### Bug #2 — ClipDetailScreen crash (P0 → FIXED)
- Path: `/clips/[id]`
- Symptom: `TypeError: (feed ?? []).findIndex is not a function` → ErrorBoundary takeover.
- Root cause: Backend `GET /api/trending/clips` returns `{ clips: [...] }` envelope. Client `listTrendingClips()` typed as `Promise<Clip[]>` and called `feed.findIndex(...)` on the envelope object.
- Fix: Client unwraps `.clips` before returning. Patch in commit 57a4a44.
- Verified: `/clips/clip_1` now renders "Clip not found" 404 state instead of crashing (clip_1 doesn't exist on backend, but at least page doesn't explode).

### Bug #3 — Missing thumbnails on cards (P1)
- Path: Discover, Home rails, list cards everywhere
- Symptom: Cards show black/empty space where thumbnailUrl should be. The `<Image>` component receives empty string and renders nothing.
- Affects: live stream cards, VOD cards, clip cards across home, discover, channel pages.
- Fix path: Image fallback. If `thumbnailUrl === ""`, render a gradient placeholder with the title text overlaid OR a game icon. Already partially done on clip player via Play icon overlay — generalize the pattern.

### Bug #4 — Stale VOD IDs in discover list (P1)
- Path: discover → click VOD → `/vod/vod_3` → "VOD not found"
- Symptom: Discover lists `vod_3` from real `listVods()` API but `getVodById("vod_3")` returns 404.
- Root cause candidates: (a) seed inconsistency between vod list seed and vod detail seed, (b) soft-deleted VOD still showing in list (deletedAt filter missing on list endpoint?), (c) ID changed during a backend reseed and stale ID surfaces from a cache.
- Fix path: backend audit — confirm `listVods()` respects `deletedAt IS NULL` and IDs in list match detail lookup.

### Bug #5 — Stream player shows black video (INFO)
- Expected — Phase 4 infra (nginx-rtmp / Cloudflare Stream) blocked on infra access. Stream rows in DB are marked `isLive: true` for demo but no actual HLS path is being ingested.
- Once Phase 4 is unblocked, this self-resolves.

## What was NOT covered

- Authenticated paths (Report button, Follow toggle, chat post) — login creds rotated/failing.
- Embed iframe `/embed/player/[streamId]` — not exercised due to time.
- Co-stream layout.
- Native iOS/Android player (only web tested).

## Next bug-bash zones

Per outstanding plan:
- P1: Auth funnel (signup/forgot/reset/verify/onboarding) — DONE (most clean; pillar copy bug logged)
- P1: Commerce (cart/checkout/orders/upgrade) — gated by auth; upgrade copy reviewed
- P1: Engagement (pickem/predictions/watch-parties/multi-stream/tips/rewards) — DONE (static review)

## Engagement bug-bash details (static review)

Authentication gate prevented E2E walkthrough. Static code review (commit f039979a-era code) found:

### P0 — runtime crash risks
- `app/(authed)/watch-parties/[id]/index.tsx:134` — `party.members.some(...)` without `?? []` guard; same pattern as event.teamIds crash.
- `app/(authed)/pickem/[eventId]/index.tsx:235` — `grouped[m.round].push(m)` crashes when backend returns a round value outside the hardcoded 3 keys (e.g. `"ro16"`).

### P1 — silent bugs / feature-broken-by-design
- `app/(authed)/multi-stream/index.tsx:99` — every tile renders `SAMPLE_HLS` instead of `stream.hlsUrl`. Defeats multi-stream entirely.
- `app/(authed)/watch-parties/[id]/index.tsx:244` — same SAMPLE_HLS hardcode, ignores party.stream.
- `app/(authed)/pickem/[eventId]/leaderboard/index.tsx:138-140` — `entry.correctPicks/totalPicks` always 0 (backend stubs). Every leaderboard row shows "0 of 0 correct".
- Date-format crash pattern across pickem/predictions/fantasy: `new Date(x).toLocaleString()` on nullable fields. Already-fixed in events; needs `safeDate()` helper applied broadly.

### Status flags
- `app/(authed)/fantasy/*` — 100% mock-backed. Phase 1A swap gap.
- `lib/api/tips.ts` — listFns still mock-backed despite real `sendTip`.

### Top fixes by impact
1. Multi-stream + watch-parties: replace SAMPLE_HLS with `stream.hlsUrl` (feature broken-by-design today).
2. Pickem round-group guard (P0 crash on round-drift).
3. Single `formatDate(iso?)` helper applied to all engagement `.toLocaleString()` sites.
4. Pickem leaderboard: hide "correct" line until backend exposes counts (currently misleading).
5. Fantasy needs Phase 1A scope decision — defer or wire mock-shaped backend endpoints.

Recommend addressing #1 + #2 + #3 together as a single PR (~2 hours).
