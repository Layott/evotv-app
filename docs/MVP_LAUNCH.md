# EVO TV — MVP Launch Spec

_Last updated 2026-05-26_

> Companion to [`PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md). This doc is the **shipping plan**: what to finish, what to submit, what to pay for, and at what scale each infra option breaks.

---

## 0. MVP definition

**The minimum that ships to Play Store + App Store:**

A phone app where a user can:

1. Open the app and **see what's airing right now** across gaming, anime, and lifestyle.
2. Open a **daily / weekly schedule grid** ("EPG") showing each show's airtime.
3. Tap a card and **watch the stream** (live or VOD) on the phone.
4. Set a **reminder** for an upcoming show (push notification 15 min before airtime).
5. **Sign in** (email or Google), follow channels, leave the app + come back, session persists.

Everything else (fantasy, predictions, watch parties, USSD, casting, anime watchlist, creator dashboard) is **post-MVP polish** — already built or shipped on mock, but not blocking launch.

---

## 1. Gap to MVP — what still has to ship

### 1.1 Combined EPG endpoint + view

**Backend gap.** Currently:

- `lib/api/events.ts` has `getEventById` → matches + bracket
- `app/(public)/calendar/index.tsx` reads `lib/mock/calendar.ts` (esports matches only)
- `episodes.premiereAt` exists in schema (`db/schema/shows.ts:99`) — never queried for a schedule view

**Build:**

| Endpoint | Returns |
|---|---|
| `GET /api/schedule?date=2026-05-27` | All scheduled content for that day across the three pillars, ordered by `airsAt` |
| `GET /api/schedule/week?from=2026-05-27` | Same, grouped by day |

Each row is the **union** of:

```ts
type EpgRow = {
  id: string;
  kind: "live_stream" | "episode" | "match";
  pillar: "esports" | "anime" | "lifestyle";
  title: string;
  subtitle: string;            // "Show name S2E5" or "Team A vs Team B"
  thumbnailUrl: string;
  airsAt: string;              // ISO 8601
  durationMin: number;
  watchUrl: string;            // /stream/[id] | /vod/[id] | /show/[slug]/.../...
};
```

The frontend renders three views off this shape:

- **Now-and-next strip** on home (`live_now + airs_within_90_min`)
- **Today's grid** on a new `/(public)/schedule/index.tsx` screen
- **Per-day picker** for the week (horizontal day chips → grid below)

**Reminders:** `POST /api/reminders { epgRowId, leadMin: 15 }` → cron at airtime − 15 min sends Expo Push.

**Effort:** 3–5 dev days (1 backend endpoint, 1 cron, 1 new RN screen, 1 home strip refactor).

### 1.2 Store listing assets

| Asset | Where | Status |
|---|---|---|
| App icon (1024×1024 + Android adaptive) | `assets/icon.png` | Need designer pass |
| Splash screen | `assets/splash.png` | Have draft |
| Feature graphic 1024×500 (Play Store only) | — | Missing |
| Phone screenshots (2–8 per platform) | — | Missing — need designer screens |
| Short description (Play 80 chars / App 30 chars) | `STORE_ASSETS.md` | Drafted, needs final |
| Full description (Play 4000 chars / App 4000) | `STORE_ASSETS.md` | Drafted |
| Promo video (optional) | — | Skip for MVP |

**Effort:** 1 designer week + 1 dev day to wire icon + splash into `app.json`.

### 1.3 iOS first build

Blocked. Needs:

- Apple Developer Program enrollment **$99/yr**
- App Store Connect bundle ID claim (`com.evotv.app` is in `app.json`)
- **Sign in with Apple** added (Apple requires it if any third-party social login is offered — currently Google OAuth)
- EAS Build iOS profile + provisioning profile + distribution cert (EAS handles all of this if `eas credentials` is run after enrolling)
- First TestFlight build, then internal testers, then public review (~24-48 hr first review)

**Effort:** 2 dev days after Apple Dev account is paid for.

### 1.4 Production track on Play Store

Currently APK 94.77 MB is on EAS `preview` channel only.

To submit to **production track** (open beta or full release):

1. `eas build --platform android --profile production` → produces signed `.aab` (Play Store requires Android App Bundle, not `.apk`)
2. Upload to Play Console → Internal testing track first
3. Promote to Closed → Open → Production (each step requires Google review, 1–3 days)
4. Fill out Data Safety form (we collect: email, name, avatar, watch history, location coarse)
5. Content rating questionnaire (likely PEGI 12 / Teen — chat + esports)
6. Set up Play Store listing with screenshots + descriptions

**Effort:** 1 dev day to switch from APK→AAB build profile and submit. Plus Google review wait time.

### 1.5 Final auth polish

- Sign in with Apple (App Store requirement). Backend + native button + deep link.
- Email verification flow exists but currently optional — make required on signup.

**Effort:** 2 dev days.

### 1.6 Minimal content seed

The app cannot launch empty. For MVP catalogue:

| Pillar | Minimum seed |
|---|---|
| Esports | 1 live tournament in progress + 10 VODs + 20 clips |
| Anime | 5 shows × 10 episodes each, weekly schedule wired |
| Lifestyle | 3 originals running daily/weekly slots |

Licensing + content acquisition is **outside the dev scope** — user owns this.

### 1.7 Designer pass

Per memory's design-parity rule: every screen must read as the same designer who built `/wallets`, `/user-profile`, `/tournaments`. Right now images are picsum/dicebear fallbacks because prod Neon's image URLs were relative placeholders (~160 rewritten 2026-05-18). Real hero/poster art still needs designer work.

---

## 2. Submission checklist — top of mind

### Google Play

- [ ] Signed `.aab` from EAS production profile
- [ ] Privacy Policy URL (have it — `/(public)/privacy`)
- [ ] Data Safety form completed
- [ ] Content rating (PEGI 12 / Teen, chat + UGC declared)
- [ ] Target audience: 13+
- [ ] App category: Entertainment / Video Players & Editors
- [ ] Screenshots: 2–8 per device class (phone, 7" tablet, 10" tablet, TV)
- [ ] Feature graphic 1024×500
- [ ] App icon 512×512
- [ ] Short description 80 chars
- [ ] Full description 4000 chars
- [ ] Pricing: free with in-app purchases (predictions coins, tips, premium sub)
- [ ] In-app product setup (Play Billing API integration — NOT WIRED YET)

### App Store

- [ ] Apple Developer Program $99/yr active
- [ ] App Store Connect record created
- [ ] Bundle ID `com.evotv.app` registered
- [ ] Sign in with Apple added (REQUIRED because we have Google OAuth)
- [ ] iOS build via EAS, uploaded to App Store Connect
- [ ] TestFlight internal testing → external testing → public
- [ ] Screenshots: 6.7" (iPhone 16 Pro Max) + 6.5" + 5.5" required
- [ ] App preview videos (optional, max 3, 15-30 sec, portrait)
- [ ] App Privacy questionnaire (very detailed, every SDK declared)
- [ ] Age rating: 12+ likely
- [ ] App category: Entertainment / Sports
- [ ] In-app purchase products configured (StoreKit 2 — NOT WIRED YET)

### IAP gotcha

Apple + Google take 15-30% on **digital goods** (predictions coins, tips, premium). For physical goods (merch from `/shop`) we can use Paystack directly. For digital we MUST route through Play Billing + StoreKit on those platforms or risk rejection. **Skip IAP for MVP — launch with free tier only**, add monetization in v1.1.

---

## 3. Streaming infra — bitrate + bandwidth math

Industry-standard average bitrates for HLS ABR delivery (H.264 baseline, x264 medium preset):

| Resolution | Bitrate | Per-hour egress per viewer | Per-8hr session |
|---|---|---|---|
| 1080p30 | 5 Mbps | 2.25 GB | **18 GB** |
| 720p30 | 3 Mbps | 1.35 GB | **10.8 GB** |
| 360p30 | 0.8 Mbps | 0.36 GB | **2.88 GB** |

Math: `bitrate (Mbps) × 3600 / 8 / 1024 = GB/hr`.

### 3.1 Daily egress per N viewers × 8 hr

| Viewers | 1080p | 720p | 360p |
|---|---|---|---|
| 10 | 180 GB | 108 GB | 28.8 GB |
| 50 | 900 GB | 540 GB | 144 GB |
| 100 | 1.8 TB | 1.08 TB | 288 GB |
| 1000 | 18 TB | 10.8 TB | 2.88 TB |

### 3.2 Monthly egress (30 days × 8 hr / viewer)

| Viewers | 1080p | 720p | 360p |
|---|---|---|---|
| 10 | 5.4 TB | 3.24 TB | 0.86 TB |
| 50 | 27 TB | 16.2 TB | 4.32 TB |
| 100 | 54 TB | 32.4 TB | 8.64 TB |
| 1000 | 540 TB | 324 TB | 86.4 TB |

### 3.3 Peak concurrent bandwidth needed

If all N viewers are watching simultaneously (a live event):

| Viewers | 1080p | 720p | 360p |
|---|---|---|---|
| 10 | 50 Mbps | 30 Mbps | 8 Mbps |
| 50 | 250 Mbps | 150 Mbps | 40 Mbps |
| 100 | 500 Mbps | 300 Mbps | 80 Mbps |
| 1000 | **5 Gbps** | **3 Gbps** | 800 Mbps |

---

## 4. Option A — Cloud streaming (managed)

Four realistic providers. Costs assume **daily 8-hour stream consumed by N concurrent viewers, 30 days/month**.

### 4.1 Cloudflare Stream — `$1 / 1000 min delivered` + `$5 / 1000 min stored`

**Charges per minute watched**, NOT per GB. Resolution-independent — you pay the same for 1080p and 360p. Includes transcode + global CDN + DRM.

Minutes/viewer/month = 30 × 480 = 14,400.

| Viewers | Monthly mins | Delivery cost | Storage (live, 1 stream × 60d retention) | Total/mo |
|---|---|---|---|---|
| 10 | 144k | $144 | ~$72 | **$216** |
| 50 | 720k | $720 | ~$72 | **$792** |
| 100 | 1.44M | $1,440 | ~$72 | **$1,512** |
| 1000 | 14.4M | $14,400 | ~$72 | **$14,472** |

**Verdict:** Easiest path. Zero infra. Resolution-agnostic. Scales linearly. Expensive at 1000+ viewers.

### 4.2 Mux Video — `~$0.0066/min HD` + `$0.005/min stored`

Premium tier. Best analytics + adaptive bitrate engineering. Charges per delivered minute, rendition-dependent.

| Viewers | Cost at HD (720p+) | Cost at SD (360p) |
|---|---|---|
| 10 | ~$950/mo | ~$475/mo |
| 50 | ~$4,750/mo | ~$2,375/mo |
| 100 | ~$9,500/mo | ~$4,750/mo |
| 1000 | ~$95,000/mo | ~$47,500/mo |

**Verdict:** Premium quality + tooling. Most expensive option. Reserve for cinematic / DRM-heavy content.

### 4.3 AWS IVS (managed live)

Channel: `$2/hr input` (regardless viewers) + egress per GB.

- Input cost: $2 × 8 × 30 = **$480/mo** (1 channel always-on)
- Egress: $0.075/GB (first 10 TB), $0.05/GB after

| Viewers | 1080p egress | 720p | 360p |
|---|---|---|---|
| 10 | $405 + $480 = **$885** | $243 + $480 = $723 | $65 + $480 = $545 |
| 50 | $2,025 + $480 = **$2,505** | $1,215 + $480 = $1,695 | $324 + $480 = $804 |
| 100 | $4,050 + $480 = **$4,530** | $2,430 + $480 = $2,910 | $648 + $480 = $1,128 |
| 1000 | ~$36,500 + $480 = **$36,980** | ~$22,000 + $480 = $22,480 | $6,480 + $480 = $6,960 |

**Verdict:** Cheaper than Cloudflare at very large scale only because AWS tier discounts kick in past 10 TB. Channel idle cost ($480/mo) hurts at low scale.

### 4.4 Bunny.net Stream — `$0.005/min storage` + `$0.005-0.04/GB delivery (region)`

Cheapest managed option. Africa delivery is on the higher end (~$0.04/GB) but still strong.

DIY origin + Bunny CDN: $0.005/GB Africa (CDN only, you transcode).

**Bunny Stream (managed):**

| Viewers | 1080p | 720p | 360p |
|---|---|---|---|
| 10 | ~$220 | ~$135 | ~$45 |
| 50 | ~$1,100 | ~$680 | ~$220 |
| 100 | ~$2,200 | ~$1,360 | ~$440 |
| 1000 | ~$22,000 | ~$13,600 | ~$4,400 |

**Bunny CDN only (origin = your Hetzner):**

| Viewers | 1080p | 720p | 360p |
|---|---|---|---|
| 10 | $27 | $16 | $4 |
| 50 | $135 | $81 | $22 |
| 100 | $270 | $162 | $43 |
| 1000 | $2,700 | $1,620 | $432 |

**Verdict:** Best price/perf for African delivery. CDN-only mode is the cheapest path if you run your own origin.

### 4.5 Comparison at a glance — 1080p, monthly $

| Viewers | Cloudflare Stream | Mux | AWS IVS | Bunny Stream | Bunny CDN + own origin |
|---|---|---|---|---|---|
| 10 | $216 | $950 | $885 | $220 | **$27 + origin** |
| 50 | $792 | $4,750 | $2,505 | $1,100 | **$135 + origin** |
| 100 | $1,512 | $9,500 | $4,530 | $2,200 | **$270 + origin** |
| 1000 | $14,472 | $95,000 | $36,980 | $22,000 | **$2,700 + origin** |

"Origin" = Hetzner AX41 €45/mo (~$50). See §5.

---

## 5. Option B — Local server (Hetzner AX41-NVMe self-hosted)

The path memory says user wants: **Hetzner AX41-NVMe €45/mo** + nginx-rtmp + ffmpeg ABR transcoder + HLS packager + direct delivery (no CDN) OR Hetzner-as-origin behind Bunny/Cloudflare CDN.

### 5.1 What you get per AX41-NVMe box

- AMD Ryzen 5 3600 (6c/12t)
- 64 GB DDR4 ECC
- 2 × 512 GB NVMe SSD
- **1 Gbit/s NIC** (shared, 1 Gbps best-effort)
- **20 TB egress included** per month, **€1/TB** after
- €45/mo (~$50)

### 5.2 Concurrent viewer cap per box (1 Gbps NIC)

`max_viewers = 1000 Mbps / bitrate_per_viewer`

| Resolution | Max concurrent on 1 box |
|---|---|
| 1080p (5 Mbps) | **200** |
| 720p (3 Mbps) | **333** |
| 360p (0.8 Mbps) | **1250** |

### 5.3 Monthly cost by scale (direct delivery, no CDN)

`cost = box × $50 + egress_overage × €1/TB`. Overage = `max(0, monthly_egress - 20 TB)`.

| Viewers | Resolution | Monthly egress | Boxes needed | Egress overage | Total/mo |
|---|---|---|---|---|---|
| 10 | 1080p | 5.4 TB | 1 | 0 TB | **$50** |
| 10 | 720p | 3.24 TB | 1 | 0 TB | **$50** |
| 10 | 360p | 0.86 TB | 1 | 0 TB | **$50** |
| 50 | 1080p | 27 TB | 1 | 7 TB → €7 | **$58** |
| 50 | 720p | 16.2 TB | 1 | 0 TB | **$50** |
| 50 | 360p | 4.32 TB | 1 | 0 TB | **$50** |
| 100 | 1080p | 54 TB | 1 (peak 500 Mbps OK) | 34 TB → €34 | **$87** |
| 100 | 720p | 32.4 TB | 1 (peak 300 Mbps OK) | 12.4 TB → €13 | **$65** |
| 100 | 360p | 8.64 TB | 1 | 0 TB | **$50** |
| 1000 | 1080p | 540 TB | **5 boxes** (5 Gbps total) | per-box overage ~88 TB → €88 each | **$250 + 5×€88 = ~$750** |
| 1000 | 720p | 324 TB | **3 boxes** (3 Gbps) | per-box ~88 TB → €88 each | **$150 + 3×€88 = ~$430** |
| 1000 | 360p | 86.4 TB | 1 (peak 800 Mbps OK) | 66 TB → €66 | **$120** |

**Caveat:** Hetzner shared 1 Gbps is "best-effort" — under contention you may see 600-800 Mbps sustained. Plan with a 20% margin. For real 1000-viewer 1080p, use 6 boxes not 5, or pair with a CDN.

### 5.4 Hetzner + CDN hybrid (recommended once viewer count climbs)

**Setup:** Hetzner runs nginx-rtmp + ffmpeg transcoder + HLS packager → uploads segments to Bunny pull-zone or Cloudflare CDN. Viewers hit the CDN edge. Origin only serves cache misses.

This is the **best-of-both-worlds** path: pay Hetzner flat for compute, pay CDN per-byte for delivery, no concurrent cap.

**1080p costs in this model:**

| Viewers | Hetzner | Bunny CDN egress | Total/mo |
|---|---|---|---|
| 10 | $50 | $27 | **$77** |
| 50 | $50 | $135 | **$185** |
| 100 | $50 | $270 | **$320** |
| 1000 | $50 | $2,700 | **$2,750** |

Compare to managed cloud at 1000 viewers/1080p: **Cloudflare $14,472 vs Hetzner+Bunny $2,750 = 5.2× cheaper.**

### 5.5 What you have to operate yourself

- nginx-rtmp config (ingest, on-publish → channel lookup)
- ffmpeg ABR ladder (1080p / 720p / 480p / 360p / 240p outputs)
- HLS packager (segment writer with 6s segments, low-latency LL-HLS optional)
- Origin auth (signed segment URLs to prevent hotlinking)
- Monitoring (Grafana on viewer counts, NIC saturation, packet loss)
- Backup origin (second AX41 in a different DC for failover)
- DRM if anime licensors require it (Widevine L3 is free, L1 needs cert) — Hetzner does NOT bundle DRM, you wire ezDRM / Axinom (~$0.005/license)

**Effort to stand up:** 5-10 dev days (per `project_phase4_infra_runbook.md`).

---

## 6. Recommendation — what to actually pick

### Phase A — MVP launch (0 → 1,000 MAU, < 100 concurrent peak)

**Use Cloudflare Stream.** $216-1500/mo. Zero infra. Resolution agnostic. Done in 2 days.

Reasoning: at this scale the savings from self-hosting (~$1300/mo) don't justify the operational cost (5-10 dev days to set up Hetzner + ongoing on-call). Cloudflare also handles DRM, global CDN, transcode, signed URLs — all things you'd build yourself.

### Phase B — Growth (1k → 10k MAU, 100-1000 concurrent peak)

**Migrate to Hetzner + Bunny CDN hybrid.** $300-3000/mo.

Trigger: when Cloudflare Stream bill crosses **$2,500/mo**, the migration ROI is < 3 months even paying a contractor for the infra build.

### Phase C — Scale (10k+ MAU, 1000+ concurrent peak)

Add a second Hetzner DC for failover. Add Cloudflare in front of Bunny for DDoS shielding. Consider multi-CDN (Bunny + Cloudflare R2 for storage + Fastly for edge logic) if uptime contract demands it.

### Resolution strategy

Default to **adaptive bitrate**: player picks 1080p / 720p / 480p / 360p / 240p based on user bandwidth. African mobile users default-skew to 360p/480p — this dramatically lowers average egress cost.

In Cloudflare Stream this is automatic. On Hetzner you encode all 5 renditions once + let HLS pick.

**Lite mode** (already mocked at `lib/mock/lite-mode.ts`) — when ON, cap top rendition at 480p. Saves 60-70% bandwidth for Nigeria 4G users with capped data plans. Wire as a real user pref + send a `?lite=1` cookie to the origin to strip 720p+ from the manifest.

---

## 7. End-to-end cost matrix (the headline numbers)

**Assumption:** 1 user watches 8 hours/day, 30 days/month. Headline = monthly bill.

### Cloud (Cloudflare Stream, easiest)

| Viewers | 1080p | 720p | 360p |
|---|---|---|---|
| 10 | $216 | $216 | $216 |
| 50 | $792 | $792 | $792 |
| 100 | $1,512 | $1,512 | $1,512 |
| 1000 | $14,472 | $14,472 | $14,472 |

### Cloud (Bunny CDN + Hetzner origin, cheapest managed-ish)

| Viewers | 1080p | 720p | 360p |
|---|---|---|---|
| 10 | $77 | $66 | $54 |
| 50 | $185 | $131 | $72 |
| 100 | $320 | $212 | $93 |
| 1000 | $2,750 | $1,670 | $482 |

### Local (Hetzner direct, no CDN — single DC, best-effort 1 Gbps)

| Viewers | 1080p | 720p | 360p |
|---|---|---|---|
| 10 | $50 | $50 | $50 |
| 50 | $58 | $50 | $50 |
| 100 | $87 | $65 | $50 |
| 1000 | ~$750 (5 boxes) | ~$430 (3 boxes) | $120 |

---

## 8. Side-by-side at 1080p for 1000 viewers (the stress test)

| Provider | Monthly | Setup time | Ops burden | Notes |
|---|---|---|---|---|
| Cloudflare Stream | $14,472 | 1 day | None | Easiest, highest cost |
| Bunny Stream | $22,000 | 1 day | None | African delivery sweet spot |
| AWS IVS | $36,980 | 2 days | Low | Idle channel cost hurts |
| Mux | $95,000 | 2 days | None | Premium, avoid at this scale |
| **Hetzner + Bunny CDN** | **$2,750** | **5-10 days** | **Medium (on-call)** | **Best ROI past growth phase** |
| Hetzner direct (no CDN) | $750 | 10 days | High (NIC saturation, no failover) | Risky for live |

---

## 9. What to do this week

1. **Apply migration 0022** to prod Neon — opens fantasy v2 stats path.
2. **Build the EPG endpoint + RN view** (3-5 days). This is the only feature blocking MVP positioning.
3. **Decide infra path** — Cloudflare Stream for MVP is the recommendation; revisit at $2,500/mo bill.
4. **Pay Apple Developer $99/yr** + build iOS via EAS + add Sign in with Apple.
5. **Designer week** — final icon, splash, feature graphic, 5-8 screenshots per platform.
6. **Submit to Play Console internal track** (AAB build) + TestFlight (iOS build).
7. **Promote to production** after 2-week beta with 20-50 testers.

Timeline: **6 weeks to public launch on both stores** assuming designer is available week 1.

---

## 10. Risks / open questions

- **IAP on Day 1?** Not recommended — adds 1-2 weeks of Play Billing + StoreKit work. Launch free, add monetization in v1.1.
- **Anime licensing.** Cannot launch anime pillar without rights. If unable to license, defer anime to v1.1 and launch with esports + lifestyle only.
- **CDN cost spike risk.** Cloudflare Stream is metered per minute — a viral live event with 50k viewers for 4 hours = ~$120k. Set spending alerts.
- **Hetzner DDoS.** Hetzner provides basic DDoS protection but not always sufficient at the public IP. Cloudflare in front of Bunny in front of Hetzner is the layered defense.
- **Data residency.** NDPR requires user data in-country or with adequate-protection countries. Neon (US/EU) + Hetzner (DE/FI) is borderline — get legal sign-off before launch.

---

## 11. After MVP — V1.1 roadmap (post-launch month 1-2)

- IAP for coins + tips (Play Billing + StoreKit)
- Sign in with Apple polish + email-only sign-in fallback
- Anime watchlist + simulcast scheduling
- Watch parties on mobile (already exists on web)
- Multi-stream side-by-side (already mocked, wire to real)
- Cast (Chromecast + AirPlay)
- Auto-clip generation from live streams
- Captions (whisper pipeline)
- USSD top-up (Africa's Talking unblock)
- Telegram + Discord bots (token unblock)

---

[[project-overview]] · [[session-snapshot-2026-05-16]] · [[phase4-infra-runbook]] · [[streaming-infra-decision]]
