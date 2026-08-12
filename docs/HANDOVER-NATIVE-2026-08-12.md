# Handover: 2026-08-12, web punch-list then the native app

Written mid-task, at the owner's request, so a new session can pick this up
cold. Covers both repos. The web work is finished and live. **The native work
is committed, unpushed, and unverified in a running app.**

Companion to `../../backend/docs/HANDOVER-LAUNCH-DAY.md`, which is the state of
production as of launch day. Read that first for anything infra.

---

## 1. Stop here first: what is unfinished

**Nothing on the native app has been run.** `pnpm typecheck` is clean and that
is the only gate this repo has. No Expo build, no simulator, no device, no web
target. Two of the three native commits change what a user sees. Treat them as
unreviewed until somebody opens the app.

The exact next step I was on when I stopped: **run the app and look at home**.

```bash
cd EVOTV-app
pnpm web            # or pnpm start, then a device
```

Then check, in order:

1. The main-channel hero renders at the top of home, above the featured
   carousel, showing `EVO TV 24/7 LIVE`.
2. Off air it reads "Back at HH:MM with <title>", not "offline" and not a bare
   card. The channel is off air right now, so this is the state you will see.
3. Pressing it opens `/stream/<id>`.
4. The same walk on a phone viewport, per the owner's rule that mobile and
   desktop both count.

`api.evotv.co/api/channel/main` is confirmed returning a real channel with a
populated `onNow`/`upNext`, so an empty hero means a client bug, not empty data.

**Nothing in EVOTV-app is pushed.** Five commits sit on
`feat/digitalocean-uploads` ahead of `origin`. Push when the walk passes:

```bash
git push origin feat/digitalocean-uploads
```

---

## 2. Native app: what changed today

| Commit | What |
|---|---|
| `a5a7d39` | Points the stale DO cold-build handoff at the launch-day one. Pushed. |
| `cd7b11b` | Removes the Apple buttons from login and signup. |
| `4cc1e2c` | Deletes `lib/mock` and the three `lib/api` modules wrapping it. |
| `9aea0a9` | Points EAS builds at `api.evotv.co`. |
| `541e989` | Flagship channel hero on home. **Unverified.** |

### The one that matters most: builds pointed at a dead host

Both EAS profiles set `EXPO_PUBLIC_API_BASE_URL` to `https://evo-tv.vercel.app`.
That host answers **404**. A build cut from either profile shipped an app that
could not sign in or load anything, with no error a user could read as "wrong
backend". `.env.local` had it too and is fixed, but **`.env.local` is
gitignored**, so a fresh checkout needs that edit by hand.

Worth a sweep: `docs/PROJECT_OVERVIEW.md`, `LAUNCH_READINESS.md`,
`BUG_BASH*.md`, `README.md` and `.claude/plugins/.../plugin.json` still name
Vercel hosts. They are documentation, so they mislead rather than break.

### The mock layer is gone

44 files, about 7.8k lines. Most was unreachable, but three modules were not:
`lib/api/pickem`, `lib/api/predictions` and `lib/api/tips` re-exported
fabricated implementations under names that look like a real data layer, and
`lib/api/chat` exported `pinMessage`, `deleteMessage` and `banUser` that
moderated an array in memory.

Nothing called them. Pick'em and Predictions render `ComingSoon`, so no user
ever saw invented data. They were deleted anyway, because an exported `banUser`
on a module a screen already imports is a trap for whoever builds the first
moderator UI.

**Rule going forward, now written into `CLAUDE.md`:** a feature with no backend
route gets a `ComingSoon` screen. Never a module that returns invented rows.

### Apple sign-in

Gone from both auth screens, and `signInWithSocial` narrows to `"google"`. The
backend registers a social provider only when its client id and secret are both
set, and production has no Apple pair, so the provider does not exist
server-side either. The button's entire behaviour was a "coming soon" toast.

---

## 3. Native app: what is still owed

1. **Run it.** See section 1. Everything else is downstream of this.
2. **Player parity.** The web got a lot of live-player work on 11 August that
   the app has not: a working scrub bar on a live stream, a DVR window that
   stays buffered, muted autoplay with one tap for sound, and the fix that
   stopped handing every viewer the stream key. Check
   `components/stream/hls-player.tsx` against the web's `video-player.tsx`.
   `liveMaxLatencyDurationCount` and `backBufferLength` must both stay above
   `hls_playlist_length / hls_fragment` from `nginx-rtmp.conf`.
3. **`requiresAuth`.** The web now requires an account to watch. The hero
   handles the flag, but the app's stream screen has not been checked against
   it.
4. **Onboarding is device-local.** `evotv:onboarded` lives in AsyncStorage, so
   the same account onboards again on a second device. The backend returns
   `onboardedAt` now; `lib/api/me.ts` does not read it.
5. **`useMockAuth` is still the imported name** in about 40 screens, aliased
   from `useAuth` in `components/providers/index.tsx`. Only the name is mock.
6. **Legal pages.** The app has `(public)/privacy`; the web rewrote both
   `/privacy` and `/terms` on 11 August. They will have drifted.

---

## 4. Web, all shipped and live today

Verified on `evotv.co` unless noted. Backend branch `feat/digitalocean`,
pushed, auto-deployed, roughly 160 to 200 seconds per deploy.

- **The rotate-key dialog was undoing the leak fix.** `provisionIngest`
  composes `<streamId>?key=<secret>`, but the regenerate route returned the bare
  secret, so the one action taken to stop a leak handed back the leaking form.
  Any key rotated before this fix is still exposed and needs rotating again.
- **Viewer counts are shared across containers** via a Valkey sorted set in
  `lib/sse/presence.ts`, replacing a per-process `Map` that reported half the
  audience on each of the two api containers. Proved with an integration test
  that loads the module twice against a real broker:
  `REDIS_URL=redis://127.0.0.1:6399 pnpm test:integration`.
- **Privacy and terms on every page**, via `components/shell/app-footer.tsx`.
- **`app.evotv.co` 301s to the apex.** Safe only because `COOKIE_DOMAIN` is
  `.evotv.co`; revert to `import evotv_next` in the Caddyfile if that changes.
- **The four test accounts are deleted**, including the May admin. 40 child rows
  removed, 20 kept with the reference nulled, including 15 `audit_log` entries.
- **Apple sign-in removed** from web login and signup, and
  `/api/mobile-auth/start` now rejects anything but `google`.
- **Landing page**: "EVO TV is coming soon to UHF." with an animated
  television beside it, test-card bars sweeping under a scanline.

---

## 5. Traps this session hit, so you do not

- **The prod database has a second schema.** A leftover Neon Auth schema
  carries its own `user`, `account`, `member` and `invitation`. Any catalog
  query about foreign keys must filter on `current_schema()` at *both* ends, or
  it reports columns that do not exist on the table it then queries.
- **A dry run built from counts taken up front lies.** It flagged
  `user_sanctions.issued_by` as blocking when the cascade on `user_id` deletes
  that row first. `scripts/delete-test-accounts.ts` now does the real work in a
  transaction and rolls it back, so the rehearsal is the thing itself.
- **The dev server serves stale CSS.** New rules were on disk and absent from
  the compiled stylesheet through two restarts; `getAnimations()` returned
  empty. Fix is kill the port holder, delete `.next`, restart. This is the trap
  already recorded in backend commit `c83f924`.
- **Chrome here always reports `visibilityState: "hidden"`**, so animation
  clocks freeze at 0 and `resize_window` does not re-render the page. Two
  consequences: mobile viewport could not be screenshotted at all, and motion
  has to be verified by forcing `animation.currentTime` and reading the computed
  transform rather than by watching.
- **Grepping for `lib/mock` with `grep -v "/lib/mock/"` hides the import
  lines you are looking for**, because it filters on line content, not path.
  That is how the mock layer looked dead when four modules still used it. `tsc`
  caught it.
- **Client-rendered pages cannot be verified by curl.** Prod `/login` returns a
  Suspense fallback, so grepping its HTML for a button reports absence for both
  a successful and a failed deploy. Use the browser.

---

## 6. Still owed on the web

1. **Lock the Cloudflare origin.** Blocked on DNS, not effort: only
   `api.evotv.co` is proxied. `evotv.co`, `www` and `app` resolve straight to
   `138.68.126.199`, and the origin answers on 443 directly. Orange-cloud those
   three first, keep SSL/TLS on Full (strict), confirm SSE still flows, then
   `./deploy/cloudflare-firewall.sh <FIREWALL_ID> --apply`. Needs a DO API
   token; `doctl` is installed neither locally nor on the droplet. Once locked,
   every hostname Caddy serves must stay proxied or its certificate renewal
   fails 90 days later.
2. **Rotate the stream key again.** The current one was pasted into a session
   transcript, and the key before it was handed out in the leaking format.
3. **Legal review** of `/privacy` and `/terms`, particularly the NDPA sections.
4. **The main channel has no poster, thumbnail or tagline**, so the hero renders
   bare between broadcasts, on both web and now the app.
5. **The `website` repo has no remote at all.** One commit, local only.
6. **Neither backend nor app has been merged to `main`.**
