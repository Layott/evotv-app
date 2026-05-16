# Bug-bash report — Authed walkthrough · 2026-05-16

First-ever authed bug-bash. Unblocked by OTP sign-in via newly-wired Better-Auth emailOTP. Token injected into web SPA localStorage as admin user (ladilawalt).

## Surface walked
- /home — public, renders
- /rewards — **P0 fixed during walk** (see below)
- /predictions — renders, 1000 coins, empty Open Now list
- /pickem — renders, 4 open events listed with brackets
- /watch-parties — renders, empty state clean
- /tips — renders, 4280 balance, streamer picker, top tippers leaderboard
- /multi-stream — renders, Stadium mode UI, only 1 LIVE pill visible (data thin)
- /cart — renders, empty state clean
- /profile — renders, layott handle, Admin badge, "No videos yet" tab content
- /settings — renders, Billing/API keys/Privacy/Terms/Account/Notifications all present

## P0 fixed during this bash

### `/rewards` 500 — migration drift on daily_quest_claims
- Symptom: ApiError 500 on rewards/index.tsx because `listDailyQuests()` queried a non-existent table (migration 0017 not applied due to journal drift on 0008).
- Fix: backend lib/api/rewards.ts wraps the claims SELECT in try/catch — if message mentions `daily_quest_claims`, treat all quests as unclaimed instead of crashing.
- Backend commit: `5161ecb` (deployed via Vercel)
- Post-fix verification: rewards page renders all 6 quest cards with full UI.

## Open issues (logged, not fixed)

### Pillar copy (still some)
- `/predictions` subtitle: "Stake EVO Coins on match winners. Picks lock at game start." — gaming-centric phrasing
- `/watch-parties` subtitle: "Co-watch live esports with friends. Side-by-side player + chat." — esports-only

### `/multi-stream` data thin
- Only 1 LIVE pill shows. Empty cards. Either backend returns no live streams or filter logic too aggressive.

### Migration 0017 still needs to apply
- `daily_quest_claims` table doesn't exist. Quest claim endpoint will still 500 when user tries to claim. Frontend fix prevents the listing crash but claim still blocked.
- See `project_phase2_resume_session.md` for manual SQL fix path.

## What's still untestable
- Cart → checkout → orders happy path (need products in cart)
- Stream player live HLS (Phase 4 infra blocked)
- Tip send (would actually subtract coins, didn't run)
- Quest claim (table missing)
- Watch-party host (would create real party row, didn't run)
- Public profile by handle (own profile route, needed `/u/[handle]` test)

## Session totals (all bashes)
- Bash 1 (admin Phase B + Chrome walkthrough): 5 bugs, 5 fixed
- Bash 2 (P0+P1 static review): 16 bugs, 5 fixed (clip envelope, event detail, engagement set, image fallback, copy reframe)
- Bash 3 (authed): 1 P0 fixed (rewards 500), 3 P1 open (pillar copy + multi-stream + migration 0017)
