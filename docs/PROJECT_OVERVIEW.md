# EVO TV — Project Overview

_Last updated 2026-05-26_

## 1. What it is

EVO TV is an Africa-first streaming app — **gaming, anime, lifestyle** content delivered to phones (Android, iOS), TVs (Android TV), and the web. One brand, one catalogue, three content pillars.

It is **not** "another esports site." Esports is a flagship pillar but the platform is wider — anime, gaming shows/podcasts, lifestyle (music, comedy, news, originals).

Two Vercel projects:

| Repo | Role | URL |
|---|---|---|
| `EVOTV-app/` (this folder) | RN + web SPA client | not yet deployed |
| `../backend/` | Next.js backend + admin | <https://evotv.co>, API on <https://api.evotv.co> |

Single DigitalOcean Managed Postgres DB. Better-Auth bearer flow for RN clients.

---

## 2. The three pillars

| Pillar | What ships | Example shapes |
|---|---|---|
| **Gaming / esports** | Live match streams, VODs, clips, brackets, fantasy leagues, pickem, predictions, tips to creators | League of Legends Africa final live · highlight VOD · Bo3 bracket · pickem ladder |
| **Anime** | Subbed/dubbed episodes, weekly drop schedule, watchlist, season tracking | "Naruto" S1E12 · drop Thursdays 18:00 WAT · season completion bar |
| **Lifestyle** | Originals (podcasts, talk shows, news, music, comedy), licensed shows | "EVO Mornings" daily 07:00 · weekend music block |

All three share **one** schedule grid (EPG) so a user opens the app and sees "what's airing right now / next / today / this week" across pillars.

---

## 3. The 10-foot view of the app

```
┌────────────────────────────────────────────────────────────┐
│ Tab bar (public)                                           │
│ Home · Events · Discover · Shop · Library · Profile         │
└────────────────────────────────────────────────────────────┘

Home          → live now strip + upcoming today + continue watching + per-pillar rails
Events        → esports tournaments, brackets, league standings
Discover      → browse by pillar/category/originals
Shop          → merch, in-app purchases, gift cards, mobile-money checkout
Library       → following, watch-later, history, downloads
Profile       → handle, avatar, followers, level, achievements

Authed-only sub-routes:
- /predictions   coin balance, daily picks
- /pickem        live event ladder
- /fantasy       leagues, lineups, scoring
- /watch-parties co-watching with chat
- /multi-stream  side-by-side viewing
- /tips          send coins to creators
- /rewards       daily quests, store
- /settings      account, prefs, billing, API keys, privacy
- /creator-dashboard  for partner channels (earnings, audience, clips)
- /notifications integrations push, in-app, email

Admin (gated by role):
- overview, analytics, streams, vods, clips, channels, users, sanctions,
  audit-log, moderation, forensic, content, ads, polls, orders, billing,
  settings, creator-program
```

---

## 4. Feature inventory (live / mocked / blocked)

### ✅ Live on real backend
- Email + password auth, Google OAuth, X-API-Key alt auth, self-delete GDPR
- Avatar upload (Vercel Blob, q=0.5, 3.5 MB pre-flight)
- User prefs (theme, lang, notif, playback)
- Live streams + VODs + clips with soft-delete and restore
- Real-time chat (SSE) and watch parties (persisted chat)
- Tips (creator payouts via Paystack — wire-up pending)
- Predictions + Pickem + Rewards (full scoring engines)
- Fantasy v2 — match_player_stats backed scoring engine (migration 0022)
- Channel partner dashboard with 5 channels seeded
- Channel-aware RTMP ingest (on-publish hashes stream key → channel lookup)
- Push notifications via Expo Push (registers on sign-in)
- Likes + watch progress + watchlist + downloads (auth-gated)
- Editable profile (`/profile/edit` → PATCH `/api/users/me`)
- Domain consistency (evo.tv → evotv.app sweep complete)

### ✅ Live admin tooling
- Role ladder: guest < user < premium < support_admin < moderator < finance_admin < admin < head_admin
- Audit log with filters + CSV export
- Force-end streams, force-delete + restore content
- User sanctions (suspend/ban/chat-ban) hook into sign-in + chat POST
- Channel suspend/unsuspend (kicks live + on-publish 403)
- Maintenance mode + global takedown banner (feature flags)
- Content reports queue + bulk resolve
- Forensic login_events (ipHash + region + deviceFp + userAgent)
- Email templates versioned

### 🟡 Mocked (works in app, no real backend yet)
- Calendar/EPG combined view (esports calendar exists, episodes/shows schedule missing)
- Cast (Chromecast / AirPlay)
- USSD (Africa's Talking blocked)
- Bots (Telegram / Discord tokens blocked)
- Auto-clips, co-streams (need Phase 4 infra)
- AI commentary, captions

### 🚫 Held by user
- Fantasy Phase 7.2 (per-player stats UI, 10d)
- Paystack Transfer real payouts
- iOS first build (waiting on $99 Apple Dev)
- Phase 4 streaming infra (Hetzner AX41 + Cloudflare Stream migration)
- Watermark / piracy detection (depends on Phase 4)

---

## 5. Stack

### Client (`EVOTV-app/`)
- **Expo SDK 52** · RN 0.76 (New Architecture on) · **Expo Router 4** (typed routes, file-based)
- **NativeWind v4** (Tailwind in RN) · shadcn semantic palette
- **TanStack Query** for server state · **Zustand** for local state
- **expo-video** for HLS playback · **expo-font** Geist + Geist Mono
- **AsyncStorage** + **expo-secure-store** (JWT on native)
- Platform splits via Metro: `*.web.tsx` wins on web, native `*.tsx` elsewhere
- pnpm (`node-linker=hoisted` — Metro needs it)
- Web target: SPA build (`expo export --platform web`) → `dist/` → Vercel rewrites

### Backend (`EVOTV/`)
- Next.js 16 App Router · Drizzle ORM · Neon Postgres
- Better-Auth bearer plugin (no cookies on native — JWT in `expo-secure-store`)
- Vercel Blob for avatar + asset storage
- nginx-rtmp on Hetzner planned for RTMP ingest (currently mock origin)
- SSE for live chat
- Vitest unit + integration tests (46 + 11 passing)
- Sentry source-map upload wired
- Vercel cron schedules (GDPR purge Sun 04:00 UTC, fantasy score 05:00 UTC)

### Distribution
- Android: signed APK 94.77 MB on `preview` EAS channel · OTA via EAS Update for JS-only changes
- iOS: not built yet
- Web SPA: not deployed. Built as a single bundle, rewrites `/(.*)→/index.html`
- Android TV: planned (Expo TV preset, same code)

---

## 6. Data model — the big tables

```
user                — auth, role, suspended_at, ban_reason, chat_banned_at
publishers          — multi-tenant partners
channels            — owned by publishers, has stream_keys + members
streams             — live broadcasts, channel_id, deleted_at
vods                — recordings, hls_url, deleted_at
clips               — short cuts of streams/VODs
events              — esports tournaments
matches             — under events, scoreA/scoreB, state
teams               — esports teams
players             — roster members
games               — Valorant, LoL, FIFA, etc.
shows               — pillar (esports/anime/lifestyle), origin_type, status
seasons             — under shows
episodes            — under seasons, premiereAt, hls_url
episode_progress    — per-user position
show_watchlist      — per-user follow on a show
predictions         — daily/event picks, coin balance
pickem_picks        — per-match picks under event ladder
fantasy_leagues     — per-game leagues
fantasy_lineups     — user picks
match_player_stats  — kills/deaths/assists/objectives feeding fantasy v2 (mig 0022)
rewards_*           — quests, XP, tier
tips_*              — coin transactions, payout queue
watch_parties       — co-watching sessions + chat
content_reports     — moderation queue
admin_audit_log     — append-only event stream
sanctions_*         — suspend/ban/chat-ban actions
login_events        — forensic IP/UA/device fingerprint
email_templates     — versioned subject/body
feature_flags       — maintenance, takedown, etc.
api_keys            — X-API-Key auth for power users
```

---

## 7. Where mocks still live (Phase 1A swap targets)

`lib/mock/*.ts` modules NOT yet swapped to `lib/api/*.ts`:

```
calendar.ts          — EPG combined view (esports cal partially real)
captions.ts          — caption tracks
commentary-tracks.ts — alt commentary audio
forensic.ts          — old forensic shape (real one is admin/forensic)
auto-clips.ts        — auto-clipper output
ai-commentary.ts     — AI play-by-play
cast.ts              — Chromecast / AirPlay
bots.ts              — Telegram / Discord
downloads.ts         — local download manager (works locally, no backend)
embed.ts             — oEmbed config (oembed endpoint live)
ussd.ts              — USSD codes
sso.ts               — OAuth providers list (live for Google only)
co-streams.ts        — co-stream merge state
lite-mode.ts         — lite-mode (web localStorage, not re-exported by barrel)
```

Plus three barrel collision exclusions (`predictions`, `tips`, `lite-mode`) — see `lib/mock/index.ts`.

---

## 8. Routing model — must-know

`app/(public)/_layout.tsx` is a `Tabs` host with **6 visible tabs**:

```
home · events · discover · shop · library-tab · profile-tab
```

**Every other public route** is registered as `<Tabs.Screen options={{ href: null }} />` so it exists but stays out of the tab bar. Forgetting `href: null` injects a new tab automatically. There is a `route-register` skill that codifies this.

Route groups:

| Group | Gate | Style |
|---|---|---|
| `(public)/` | none | Tabs host |
| `(auth)/` | redirect to home if signed in | slide-from-bottom |
| `(authed)/` | redirect to `/(auth)/login` if signed out | Stack |
| `(admin)/` | `(authed)/` gate + `role !== "admin"` redirect | Stack |
| `(embed)/` | none | fade, black bg, iframe-style |

---

## 9. Compliance / ops state

- Privacy Policy + ToS shipped (Nigerian jurisdiction, NDPR + GDPR aware) — `docs/PRIVACY.md`, `docs/TERMS.md`
- In-app legal at `/(authed)/settings/privacy` and `/terms`
- Signup screen links both
- GDPR delete account flow live with 30-day grace + Sunday cron purge
- Sentry source-map upload wired (5 env vars)
- `STORE_ASSETS.md`, `LAUNCH_READINESS.md`, `BUG_BASH.md`, `RELEASES.md` all checked in
- App version pinned at `0.1.0` until v1 launch — do not bump

---

## 10. The 5-layer Agent Development Kit setup

This project follows the ADK structure documented in `CLAUDE.md`:

| Layer | Where | What |
|---|---|---|
| 1 — Memory | `CLAUDE.md` files | Rules + naming + repo map |
| 2 — Skills | `.claude/skills/` | `route-register`, `mock-feature-add`, `platform-split`, `expo-screen-scaffold`, `phase1a-swap` |
| 3 — Hooks | `.claude/hooks/` | SessionStart context, PreToolUse block list, audit log |
| 4 — Subagents | `.claude/agents/` | `code-reviewer`, `test-runner`, `explorer`, `feature-dev` |
| 5 — Plugins | `.claude/plugins/evotv-app-kit/` | Distributable bundle |

---

## 11. Verification gate

There is **no unit test runner** in the client repo. The green-light gate is:

```bash
pnpm typecheck
```

Backend (`EVOTV/`) runs Vitest:

```bash
pnpm test            # unit
pnpm test:integration # integration
```

UI changes are walked manually in the dev server (`pnpm start` / `pnpm web`).

---

## 12. The Phase 1A swap

When the backend is ready and a mock module's signature exactly matches its `lib/api/*.ts` twin, the swap is **one line per call site**:

```ts
// before
import { listLiveStreams } from "@/lib/mock/streams";

// after
import { listLiveStreams } from "@/lib/api/streams";
```

That is the entire intent of the mock/api parallel structure. The `phase1a-swap` skill walks the recipe.

---

## 13. What this app competes with

- **Twitch** for live esports
- **Crunchyroll / Netflix Anime** for anime
- **Showmax / DStv Stream** for African lifestyle
- **YouTube** for VODs + clips

The wedge: **Africa-first** (NGN pricing, mobile-money checkout, USSD top-up, low-bandwidth modes, regional CDN) + **one app for three pillars** (avoids the friction of switching apps).

---

## 14. Open loops (as of 2026-05-26)

- Apply migration 0022 to prod Neon (match_player_stats) — `pnpm db:migrate` in `EVOTV/`
- Wire combined EPG (episodes + streams + matches) — backend endpoint + RN view (see `MVP_LAUNCH.md`)
- iOS first build (needs Apple Developer Program $99/yr)
- Phase 4 streaming infra decision (Hetzner self-host vs Cloudflare Stream vs hybrid — see `MVP_LAUNCH.md`)
- v1 launch prep: icon, screenshots, store listing copy, version bump
- Designer pass on hero/poster art (current images are picsum/dicebear fallbacks)

---

[[mvp-launch]] · [[session-snapshot-2026-05-16]] · [[e2e-walkthrough-2026-05-18]]
