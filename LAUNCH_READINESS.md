# EVO TV — Launch Readiness Snapshot

**Generated:** 2026-05-15
**Stage:** Pre-launch (version 0.1.0 — bumps to 1.0.0 at submission)

---

## Backend (evo-tv.vercel.app)

### Health checks (all pass)

| Endpoint | Status |
|---|---|
| `GET /api/streams` (public list) | 200 ✓ |
| `GET /api/feature-flags/public` | 200 ✓ |
| `GET /api/oembed?url=…` | 200 ✓ |
| `GET /api/admin/streams` (admin token) | 200 ✓ |
| `GET /api/admin/vods` | 200 ✓ |
| `GET /api/admin/clips` | 200 ✓ |
| `GET /api/admin/sanctions` | 200 ✓ |
| `GET /api/admin/reports` | 200 ✓ |
| `GET /api/admin/audit-log` | 200 ✓ |
| `GET /api/admin/users` | 200 ✓ |
| `GET /api/admin/email-templates` | 200 ✓ |
| `GET /api/admin/streams` (no auth) | 403 ✓ |

### Migrations applied to prod Neon

```
0001_lovely_sentry
0002 … 0009  (rewards, multi-tenant, RTMP, predictions, pickem, parties, idempotency, GDPR user.deletedAt, party_messages, api_keys)
0010_mature_caretaker        (admin_audit_log — unused, can be dropped manually)
0011_soft_delete_streams      (deletedAt on streams/vods/clips)
0012_user_sanctions
0013_content_reports
0014_channel_suspend
0015_login_events
0016_email_templates
```

### Crons

| Path | Schedule | Status |
|---|---|---|
| `/api/cron/analytics` | `0 2 * * *` | Wired |
| `/api/cron/payouts` | `0 3 * * 0` | Wired |
| `/api/cron/gdpr-purge` | `0 4 * * 0` | Wired |

CRON_SECRET set on Vercel. Per-minute cron (viewer-count) replaced by read-time calc.

### Env vars verified

- `DATABASE_URL` + Postgres flock (Neon)
- `BETTER_AUTH_URL` = `https://evo-tv.vercel.app`
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (OAuth working end-to-end)
- `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_ORG` + `SENTRY_PROJECT` + `SENTRY_AUTH_TOKEN` (source-map upload green)
- `CRON_SECRET`
- `PAYSTACK_SECRET_KEY` + `PAYSTACK_PUBLIC_KEY`
- `BLOB_READ_WRITE_TOKEN` (Vercel Blob for avatars)

---

## React Native (preview channel)

### Build state

- **Native:** APK `app-release.apk` 94.77 MB (local build, signed) — commit `c5fdf76` baseline + every OTA since
- **Channel:** `preview`
- **Latest OTAs landing on next cold start:**
  - `phase-b-admin-complete` (`d4cb7faf-c381-4466-a198-34a0f0784bac`)
  - `admin-restore-deleted-streams` (`bb9264f7`)
  - `report-buttons-vod-clip-profile` (`402a6ea7`)
  - `avatar-size-fix` (`5adc7d79`)

### Verification gates

| Gate | Status |
|---|---|
| `pnpm typecheck` (RN) | ✓ |
| `pnpm lint` (RN) | ✓ (0 errors, 70 style warnings) |
| `pnpm test` (backend) | ✓ 46 unit tests |
| `pnpm test:integration` (backend, prod) | ✓ 11 smoke tests |

---

## Admin tooling — Phase A + B complete

| Capability | Status |
|---|---|
| Role ladder (8 roles) + canGrantRole | ✓ |
| Audit log + RN viewer + CSV export + advanced filters | ✓ |
| Force-end / soft-delete / restore — streams + VODs + clips | ✓ end-to-end (admin UI) |
| User sanctions (suspend/ban/chat-ban) + sign-in block + chat-POST block | ✓ |
| Sanctioned users list screen | ✓ |
| Content reports — POST, queue, resolve/dismiss + bulk | ✓ |
| Report buttons on stream/VOD/clip/profile | ✓ |
| Channel suspend / unsuspend | ✓ |
| Maintenance mode + global takedown banner | ✓ |
| Forensic login_events (IP hashed, region, device fp) | ✓ |
| Email templates real backend | ✓ |
| Per-admin audit history view | ✓ |
| Self-delete account UI + 30-day GDPR purge | ✓ |
| API keys + X-API-Key auth | ✓ |
| Avatar upload via Vercel Blob | ✓ |
| Google OAuth (web client) | ✓ end-to-end |
| oEmbed for streams/VODs/clips | ✓ |

---

## Launch prep

- [✓] `docs/PRIVACY.md` — NDPR + GDPR aware, Nigerian jurisdiction
- [✓] `docs/TERMS.md` — non-refundable tips, Lagos arbitration
- [✓] In-app Privacy + Terms screens (Settings → Privacy / Terms)
- [✓] Signup screen surfaces "Read Terms" + "Read Privacy" links
- [✓] `STORE_ASSETS.md` — Google Play + Apple checklist with draft copy

### Remaining for v1 store submission

- [ ] Design icon 512×512 (Play) + 1024×1024 (Apple, padded)
- [ ] 6 portrait phone screenshots (1080×1920) walking key flows
- [ ] Feature graphic 1024×500 (Play)
- [ ] Bump `app.json` version to `1.0.0`
- [ ] EAS production build for both platforms
- [ ] Submit to Play Console + App Store Connect
- [ ] Apple Developer account ($99/yr)
- [ ] Privacy + Terms public web routes at `/privacy` + `/terms` for store-required URLs

---

## Known infra blockers (deferred to Phase 4)

- Watermark / piracy detection — needs Cloudflare Stream + transcode worker
- Auto-clips (highlight extraction) — needs Phase 4 transcode infra
- Captions (whisper transcription → SRT) — needs cloud GPU
- Co-streams (multi-host layout) — needs LL-HLS infra
- Phase 4 infra items (CDN, RTMP-S TLS, ABR ladder, LL-HLS, DVR) — Hetzner box + Cloudflare access required
- Phase 8 USSD — Africa's Talking API creds
- Phase 8 Bots — Telegram + Discord bot tokens
- Phase 8 Cast — native module → APK rebuild
- iOS first build — Apple Developer creds

---

## Mostly-done items still in code but not user-visible

- Manual `DROP TABLE admin_audit_log` via Neon console — cosmetic
- Apple OAuth env-gating in `lib/auth/index.ts` is ready, just needs `APPLE_CLIENT_ID` + `APPLE_CLIENT_SECRET`

---

## What's safe to ship today

The Android APK is feature-complete for African esports streaming with:
- Live + VOD + clip watching
- Real-time chat with moderation
- Watch parties with persisted chat
- Predictions + pickem + leaderboards
- Tips + rewards + shop
- Channel partner dashboard
- Admin tooling (full Phase A + B)
- Google OAuth sign-in
- Privacy + Terms in-app

Holding for v1 launch:
- Fantasy (Phase 7.2)
- Real Paystack Transfer for payouts
- Phase 4 streaming infra hardening
- Watermarking
- iOS

When you're ready to flip the v1 switch: bump `app.json` to 1.0.0, run `eas build --profile production`, submit.
