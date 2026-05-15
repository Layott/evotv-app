# EVO TV — App Store Assets Checklist

Live tracking of what's needed for Google Play + Apple App Store submission. ✓ = ready in repo. ✗ = needs design work.

---

## Branding source-of-truth

- **Brand color (cyan):** `#2CD7E3`
- **Background (dark):** `#0A0A0A`
- **Logo (square, padded):** `assets/icon.png` ✓
- **Adaptive icon foreground (Android):** `assets/adaptive-icon.png` ✓
- **Splash (solid black):** `assets/splash-black.png` ✓
- **Favicon (web):** `assets/favicon.png` ✓

If any of these change, regenerate ALL store asset variants below.

---

## Google Play Console

### Required
- [✓] App icon — 512×512 PNG (no alpha) — generate from `icon.png`
- [✗] Feature graphic — 1024×500 PNG/JPG (banner shown on Play listing top)
- [✗] Phone screenshots — 2–8 PNGs, 16:9 or 9:16, min 320px, max 3840px (recommend 1080×1920 portrait)
- [✗] 7-inch tablet screenshots — optional but recommended
- [✗] 10-inch tablet screenshots — optional
- [✓] Privacy Policy URL — `https://evotv-app.vercel.app/privacy` (host the markdown rendered, or link to the in-app screen externally — needs a web route)
- [✗] Short description — max 80 chars
- [✗] Full description — max 4000 chars
- [✗] Content rating — IARC questionnaire (chat features, user-generated content, in-app purchases)
- [✗] Target audience — pick age range; we're 13+
- [✗] Contact email — `support@evotv.app`
- [✗] Contact website — `https://evotv-app.vercel.app`

### Data safety form
Match the Privacy Policy:
- Collects: account info (email, name), watch history, IP (hashed), device ID, payment info via Paystack
- Shares with: Vercel, Neon, Paystack, Sentry, Google OAuth (if user signs in with Google)
- Encrypted in transit: yes
- Can request deletion: yes (in-app + via privacy@evotv.app)
- Personal data is purged within 30 days of self-delete

### Drafts to write

**Short description (80 chars):**
> African esports streams, chat, predictions, fantasy — all in one app.

**Full description draft (~1500 chars):**
> EVO TV is the home of African esports. Watch live tournaments, follow your favorite teams and creators, drop tips, predict match outcomes, and build your fantasy roster — all in one app.
>
> WATCH LIVE
> • Free Fire, PUBG Mobile, EA FC, CoD Mobile, Tekken, and more
> • Top African tournaments + 24/7 EVO TV channel
> • Multi-quality HLS playback
>
> CONNECT
> • Real-time chat with viewers worldwide
> • Watch parties — sync up with friends
> • Follow streamers + channels
> • Tip your favorites with EVO coins
>
> PLAY ALONG
> • Predict match winners + earn payouts
> • Pickem brackets for the biggest events
> • Build your fantasy team
> • Climb the leaderboards
>
> FOR CREATORS
> • Apply to stream
> • Channel analytics dashboard
> • Stream key rotation + chat moderation
> • Weekly payouts via Paystack
>
> EVO TV is built in Lagos for African gamers, with global reach.

---

## Apple App Store Connect

> All Apple work is deferred until an Apple Developer account ($99/yr) is provisioned. This block is the checklist for when it lands.

### Required
- [✗] App icon — 1024×1024 PNG (no alpha, no rounded corners)
- [✗] iPhone screenshots — 6.5" + 5.5" displays (minimum)
- [✗] iPad screenshots — 12.9" + 11" (if supportsTablet stays on; currently `ios.supportsTablet: true` in app.json)
- [✗] App preview videos — optional but boost conversion
- [✗] Promotional text — max 170 chars
- [✗] Description — max 4000 chars
- [✗] Keywords — comma-separated, 100 chars total
- [✗] Support URL — `https://evotv-app.vercel.app`
- [✗] Marketing URL — same or dedicated landing page
- [✗] Privacy Policy URL — required
- [✗] Age rating — answered via App Store Connect questionnaire (Frequent/Intense Mature/Suggestive Themes = none; chat triggers user-generated content rating)
- [✗] Pricing & Availability — free, available in all African countries + global

### App Privacy disclosure
Same as Google Play data-safety, in Apple's structured format. Match the Privacy Policy categories.

---

## Web SPA listing

Already on `evotv-app.vercel.app`. Pre-launch:

- [✗] Marketing landing page — currently the home screen serves; consider a marketing-specific route
- [✗] OG / Twitter card metadata
- [✓] Privacy + Terms screens (in-app)
- [✗] Privacy + Terms publicly accessible at predictable URLs (e.g. `/privacy`, `/terms`) — needs route shims on the web build that render the same legal docs

---

## App Store assets I can generate locally

Sized variants from `icon.png` (1024×1024 source recommended):

```
# Bash (requires ImageMagick or similar)
convert assets/icon.png -resize 512x512 assets/store/play-icon-512.png
convert assets/icon.png -resize 1024x1024 assets/store/ios-icon-1024.png
```

Screenshots require a running device + screen-record. Cleanest approach:
1. Run `pnpm android` or load the latest OTA on a real device.
2. Walk through: Home → Stream → Chat → Watch parties → Predictions → Profile.
3. Save each frame as 1080×1920 PNG via the device's screenshot.
4. Optionally add device frames using a tool like screenshot.rocks or manual Figma.

---

## Submission gates

Before submitting:

- [✓] App version pinned at 0.1.0 (per user instruction — bump to 1.0.0 at launch)
- [✓] All migrations applied to prod (latest: 0016)
- [✓] Sentry env vars present
- [✓] CRON_SECRET set
- [✓] BETTER_AUTH_URL canonical (`https://evo-tv.vercel.app`)
- [✓] Google OAuth env vars set (callback URL registered)
- [✓] GDPR purge cron scheduled (Sundays 04:00 UTC)
- [✗] Apple Developer account ($99/yr)
- [✗] APK rebuilt with bump to versionName 1.0.0
- [✗] iOS first build via EAS or local Xcode

---

## When ready to bump to 1.0.0

1. `app.json` `version: "1.0.0"`
2. `RELEASES.md` add a v1.0.0 row
3. `eas build --platform all --profile production`
4. Submit to Play + Apple

Until then, every change ships via OTA (free, instant) to the existing builds.
