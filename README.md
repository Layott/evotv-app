# EVO TV — App

Native iOS + Android (+ Android TV + web preview) twin of the EVO TV web app.

Sibling repo to `../EVOTV/`. Same brand, same data, same flows.

## Stack

- **Expo SDK 52** (React Native 0.76 New Architecture)
- **Expo Router 4** — file-based routing that mirrors Next.js App Router
- **NativeWind v4** — Tailwind in RN, same tokens as web
- **TanStack Query + Zustand** — same state libs as web
- **react-native-reusables** — shadcn-style RN primitives
- **lucide-react-native** — same icon set as web
- **expo-video** — native HLS playback
- **expo-font** — Geist + Geist Mono
- **AsyncStorage / SecureStore** — persistence

## Run

```bash
pnpm install
pnpm start              # Expo dev server, scan QR with Expo Go
pnpm ios                # iOS simulator (macOS only)
pnpm android            # Android emulator
pnpm web                # web preview (RN-Web)
pnpm typecheck          # tsc --noEmit
```

## Layout

```
EVOTV-app/
├── app/                    # Expo Router (mirrors EVOTV/app/)
│   ├── (auth)/             # login, signup, forgot, verify, onboarding
│   ├── (public)/           # home, events, discover, shop, ...
│   ├── (authed)/           # profile, library, watch-parties, ...
│   ├── (admin)/            # admin/*
│   └── (embed)/            # embed/* (iframe-only on web)
├── components/             # Domain components (auth/, home/, stream/, ...)
│   └── ui/                 # RN twins of shadcn primitives
├── lib/
│   ├── mock/               # 1:1 port from EVOTV/lib/mock/
│   ├── api/                # Phase 1 swap point
│   ├── theme/              # tokens
│   ├── storage/            # AsyncStorage helpers
│   └── utils.ts
├── assets/                 # icons, splash, fonts
└── tailwind.config.js      # design tokens (mirrors web)
```

## Brand

- **Cyan:** `#2CD7E3`
- **Background:** `#000000`
- **Font:** Geist (sans), Geist Mono (mono)
- **Theme:** Dark-first (matches web default)

## Backend

App fetches from web's `/api/*` routes once Phase 1A lands. Set
`EXPO_PUBLIC_API_BASE_URL` in `.env`. Default `http://localhost:3060` for
local dev against the web app's API.

For now (Phase F mock parity), all data comes from `lib/mock/` — no
backend needed.

## First-boot checklist

Before `pnpm start` succeeds end-to-end:

1. **`pnpm install`** in this folder.
2. **Drop Geist fonts** into `assets/fonts/`:
   - `Geist-Regular.ttf`, `Geist-Medium.ttf`, `Geist-SemiBold.ttf`, `Geist-Bold.ttf`, `GeistMono-Regular.ttf`
   - Source: `github.com/vercel/geist-font` (.otf files; convert to .ttf with `fontforge` or `otf2ttf` if Expo complains).
   - Until they're present, `font-loader.tsx` will fall back to system font (Geist isn't bundled by Expo).
3. **Drop app icons + splash** into `assets/`:
   - `icon.png` (1024×1024, opaque)
   - `splash.png` (1242×2436 or larger; transparent works)
   - `adaptive-icon.png` (1024×1024 — Android adaptive icon foreground)
   - `favicon.png` (48×48 — web preview)
   - Use the EVO TV logo from `https://hebbkx1anhila5yf.public.blob.vercel-storage.com/evotv%20colored-cLVxaAns95OoPRdSwAHZUktQ6y8MTs.png` until brand assets are finalized.
4. **`pnpm start`** → scan QR with Expo Go on a physical device. iOS sim works on macOS only; Android emulator works on Windows/macOS/Linux.

## Known follow-ups

- **Mock function gaps:** `getWatchHistory`, follow-aggregator, downloads-as-Vods all need shaping inside library/profile screens. The `LibraryTabs` component accepts generic shapes; wire data when ready.
- **Cross-group tabs:** current Tabs layout shows only public tabs (Home/Events/Discover/Shop). Library + Profile reachable via `router.push("/library")` etc. Add a "More" tab or header drawer to surface authed routes if needed.
- **Calendar `.ics` download:** `lib/mock/calendar.ts` `downloadIcs()` is a no-op shim. Wire `expo-file-system` + `expo-sharing` when calendar feature lands.
- **Embed + API-access pages:** web-iframe heavy. Either rebuild as RN-native or hide on app.
- **`(public)/_layout.tsx` Tabs `name`:** uses `name="home/index"` form. If routes don't resolve in Expo Router 4 at first boot, change to `name="home"` (folder-only) — depends on Expo Router resolver behavior in your installed minor version.
- **Geist fallback:** font-loader wraps `useFonts` in try/catch so missing assets won't crash boot — system font fills in.

## Phase 1A swap

When the web app ships bearer-token `/api/auth/*` and the rest of the API:

1. Create `lib/api/<feature>.ts` modules with identical function signatures to `lib/mock/<feature>.ts`.
2. Swap import sources (one line per call site, or use a barrel re-export indirection).
3. Wire `EXPO_PUBLIC_API_BASE_URL` + JWT storage in `expo-secure-store` (already a dep).
4. Replace `MockAuthProvider` with a real `AuthProvider` that runs Better-Auth bearer-token signin/signout against the web API.

## Stores

- **Apple App Store:** EAS Build → submit. Bundle ID `com.evotv.app`.
- **Google Play Store:** EAS Build → submit. Package `com.evotv.app`.
- **OTA updates:** EAS Update lets you push JS-only fixes without store review.

## Web build + Vercel deploy

The same codebase ships as a Single-Page App on web via React Native Web + NativeWind. Mode is set to `output: "single"` (SPA) in `app.json` because static rendering trips Reanimated SSR (`__reanimatedLoggerConfig` undefined at pre-render).

**Local web build:**
```bash
pnpm expo export --platform web
# outputs static SPA into ./dist/
# index.html + _expo/static/{js,css}/* + assets/*
```

**Bundle size:** ~4.05 MB JS + 17 kB CSS first paint. Hermes-style transformed code is fat — accept it as the cost of native parity. Tree-shakable; production minify already enabled.

**Vercel:**

`vercel.json` is committed. To deploy:

1. **First time** — push `EVOTV-app/` to its own GitHub repo (sibling to `EVOTV/`).
2. **Connect on Vercel** — import the new repo. Vercel auto-detects `vercel.json`:
   - Build Command: `pnpm expo export --platform web`
   - Output Directory: `dist`
   - Install Command: `pnpm install --frozen-lockfile`
   - Framework: none (Vercel doesn't have first-class Expo Router web detection yet)
3. **SPA routing rewrite** — `vercel.json` rewrites `/(.*) → /index.html` so deep links resolve to the client-side router.
4. **Cache headers** — `_expo/static/*` gets `max-age=31536000, immutable`. Hashed filenames make this safe.

**Subdomain:**
- Default: `<project>-<team>.vercel.app`
- Claim short: `vercel alias set <deploy> evotv-app.vercel.app`
- Web app already owns `evotv.vercel.app`. Suggest `evotv-app.vercel.app` for the SPA.

**Web limitations vs native:**

| Feature | Native | Web |
|---|---|---|
| HLS streams | ✅ via expo-video native player | ⚠️ Safari yes, Chrome/Firefox needs `hls.js` polyfill (TODO) |
| AsyncStorage | ✅ AsyncStorage | ✅ falls back to `localStorage` |
| expo-secure-store | ✅ Keychain/Keystore | ⚠️ `localStorage` (insecure — don't store real tokens) |
| Push notifications | ✅ APNs/FCM | ❌ no push (use Web Push later) |
| Haptics | ✅ | ❌ no-op |
| Reanimated worklets | ✅ | ⚠️ runs on JS thread (slower) |
| Geist fonts | via `expo-font` | via web font loader (can switch to Google Fonts CDN later) |

**Web target use cases:**
- Marketing preview (`evotv-app.vercel.app/home`)
- Embedded player (`/embed/player/<streamId>`)
- Desktop watchers (laptop is a real use case for Africa esports streams)
- Smart TV browser fallback if no Android TV app yet

If Web becomes a real target instead of a preview, install `hls.js` + conditionally swap player on `Platform.OS === "web"`.
