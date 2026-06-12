# Mock purge punch list (2026-06-12)

User items + audit-confirmed scope. Audit run: wf_0213c30b-9b6 (7 agents).

## Main thread (shared files)
- [ ] Billing: remove fake Visa 4242 card, fabricated history rows, wire real cancelSubscription, fix dialog copy, remove Pay-with-Mobile-Money tile
- [ ] Delete mobile-money checkout route + entry links (checkout/index.tsx, settings/index.tsx)
- [ ] Downloads: delete route, drawer link, library tab, lib/mock/downloads + barrel
- [ ] API keys: move settings/api-keys -> (admin)/admin/api-keys, remove settings card, delete (public)/api-access group + registrations + drawer link + shell + lib/mock/api-keys
- [ ] Settings: fake password change -> real Better-Auth change-password or remove; privacy toggles persist via prefs or remove; drop `${handle}@evotv.app` fake email fallback
- [ ] Delete dead mock importers: calendar-page, bot-config-page, store-landing, platform-bits, drop-card, provider-tile (+ orphaned lib/mock modules + barrel lines)

## Agent 1: channel page rewrite (app/(public)/channel/index.tsx)
- [ ] Real schedule via lib/api/schedule, live-gated badges, real/removed follow, offline state, delete dev copy

## Agent 2: admin hub (overview-page, metric-card, analytics-page)
- [ ] Fix flex-wrap overlap bug (both screens)
- [ ] Rebuild overview as hub: all 19 admin routes incl. new api-keys, live mini-stats

## Agent 3: categories (categories/*, onboarding stat)
- [ ] ImageWithFallback, drop fake activePlayers stats

## Agent 4: fake interactions (vod-comments, clips/[id], cart, upgrade, live-chat)
- [ ] Comments -> honest coming-soon; clip save -> real bookmark; remove EVO10 promo; tier price from API; remove fake chat settings

## Agent 5: backend (EVOTV) + uploads
- [ ] POST /api/admin/uploads (vercel blob, admin gate)
- [ ] Admin-gate /api/account/api-keys
- [ ] channels/[slug] viewer-count override
- [ ] seed.ts prod guard
- [ ] scripts/purge-fake-seeds.mjs (write only, run after review)
- [ ] content-manager GameDrawer: upload picker replaces Cover/Icon URL paste; ads placeholder default

## Verify
- [ ] pnpm typecheck (app) + backend typecheck/build check
- [ ] Run purge script vs prod DB (conservative updates only)
- [ ] Commit both repos, update memory
