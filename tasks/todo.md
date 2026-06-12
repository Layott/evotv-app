# Mock purge punch list (2026-06-12)

User items + audit-confirmed scope. Audit run: wf_0213c30b-9b6 (7 agents). App commit 81c1cf5, backend commit af78ccb.

## Main thread (shared files)
- [x] Billing: removed fake Visa 4242 card, fabricated history rows, wired real cancelSubscription, fixed dialog copy, removed Pay-with-Mobile-Money tile
- [x] Deleted mobile-money checkout route + entry links (checkout/index.tsx, settings/index.tsx)
- [x] Downloads: deleted route, drawer link, library tab, lib/mock/downloads + barrel
- [x] API keys: moved settings/api-keys -> (admin)/admin/api-keys, removed settings card, deleted (public)/api-access group + registrations + drawer link + shell + lib/mock/api-keys
- [x] Settings: real Better-Auth change-password wired; fake privacy toggles removed; fake email fallback removed
- [x] Deleted dead mock importers: calendar-page, bot-config-page, store-landing, platform-bits, drop-card, provider-tile, program-pitch, dashboard-shell, bot-icon (+ lib/mock calendar/bots/apps + barrel lines)

## Agents
- [x] Channel page: real EPG schedule, live-gated badges/uptime/viewers, follow removed (no real target), offline state, dev copy deleted
- [x] Admin hub: overlap fixed (metric-card flex-1 + wrap grid), overview = hub with all 19 routes + 7 live stats, MRR surfaced
- [x] Categories: ImageWithFallback, fake activePlayers stats dropped (also onboarding)
- [x] Fake interactions: vod comments coming-soon, clip save/comment removed (no backend endpoint), EVO10 promo removed, upgrade price from API, fake chat settings removed
- [x] Backend: POST /api/admin/uploads, api-keys admin-gated, channels/[slug] viewer leak fixed, seed prod guard, purge script written
- [x] Session: 30d -> 7d sliding inactivity expiry (lib/auth/index.ts)

## Verify
- [x] pnpm typecheck clean (both repos)
- [x] Purge dry-run verified (7 streams + 4 games match screenshot fakes)
- [x] Commits: app 81c1cf5, backend af78ccb

## Ship status (2026-06-12, "deploy it")
- [x] Backend deployed: dpl_4uVxRoWtV32ryf4T9mUcjg9fsXay -> evo-tv.vercel.app (smoke: admin routes 403, uploads 405 = live)
- [x] OTA published: update group 9b0bc8d6-248a-4271-abd5-bd72316f1b32, branch preview, runtime 0.1.0
- [x] App pushed: 9aac398..d34738a; backend pushed: c1faa36..af78ccb
- [ ] STILL BLOCKED (classifier requires explicit user yes): purge prod DB fake telemetry: `cd EVOTV && node scripts/purge-fake-seeds.mjs` (dry-run verified, UPDATE-only). Until run: channel still shows 24.3k viewers, games still show fake millions.
- [ ] Optional: channel_main DB title contains an em dash ("EVO TV Channel — 24/7 Esports"); fix title text when purging.

## Follow-ups (backend gaps found, not built)
- Payment history endpoint (payment_events table) for multi-row billing history
- Clip bookmarks (polymorphic or clip_bookmarks table) to restore Save on clips
- Comments endpoint (VOD + clip) to replace coming-soon cards
- Chat slow-mode/subs-only as real channel settings
- Admin waitlist count endpoint (listAdminWaitlist downloads all rows for count)
- Video upload for VODs (Cloudflare Stream direct-upload URL endpoint); HLS manifest paste on admin streams is by design
