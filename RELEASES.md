# EVO TV — Release log

Human-readable map of every OTA bundle published, with what changed + the EAS update group ID. Most recent at top.

App `version` field in `app.json` stays pinned at `0.1.0` until v1 launch — DO NOT bump until then. Native APK builds are tracked separately under "APKs" below.

---

## OTA bundles (preview channel)

| Date | Label | Update group ID | Commit | Highlights |
|---|---|---|---|---|
| 2026-05-15 | oauth-landing-stub | `0f7aca0f-f73f-473c-ac7e-5da508bafa32` | `329ddb5` | Absorb evotv://oauth deep link on Android so the user lands on /home, not +not-found |
| 2026-05-15 | admin-force-end-delete | `08f345c1-ac0a-4598-8aee-65b6ec5069d5` | `0be7d59` | RN streams-manager modal gets Force-end + Delete buttons with confirm dialogs |
| 2026-05-15 | audit-log-viewer | `57725394-0d31-43fb-ae0c-00e770afe424` | `51be13b` | Admin audit-log RN screen + quick link from overview |
| 2026-05-15 | avatar-upload | `3d16e1b6-4ba5-4269-b04d-2d378c650f67` | `4897c73` | Profile picture upload via Vercel Blob (tap avatar → image picker) |
| 2026-05-15 | google-oauth-buttons | `7090d253-62d5-455d-8f19-58bb0bb82dc9` | `cd96a8b` | Login + signup "Continue with Google" buttons wired to real OAuth via mobile-auth bridge |
| 2026-05-15 | heartbeat-wired | `1a0746ba-a9e1-4765-827e-69e65116317a` | `58cb479` | RN heartbeat hook wired into stream + embed → closes viewer-count loop |
| 2026-05-15 | party-chat-real | `a48caa29-114e-4c1a-b9bd-740e9b1543f4` | `58cb479` | Party chat persisted via backend + SSE deltas |
| 2026-05-15 | parties-detail-flip | `8edbf5d0-cf12-4e24-9279-8ec6d269fdd3` | `58cb479` | Watch-parties new + detail screens flipped to real backend |
| 2026-05-15 | parties-list-flip | `fac97a0b-3ba7-4ef7-9c72-fb0bad3841f2` | `58cb479` | Watch-parties list screen real backend |
| 2026-05-15 | streams-content-manager-flip | `ff982098-bfd5-4b13-a8ca-066bcdff7a1d` | `58cb479` | Admin streams-manager + content-manager read-only flips |
| 2026-05-15 | content-manager-flip | `4d3d741d-2e50-4b19-acbc-ac0e6f46ddfd` | `58cb479` | Admin content-manager (games/teams/players/events) read-only |
| 2026-05-15 | ads-overview-flip | `530bb5ce-fd6c-434b-8abf-61ee3941d38f` | `58cb479` | Admin ads-manager full CRUD + overview metrics |
| 2026-05-15 | admin-orders-polls-users | `35af2b94-b8be-4102-b8f5-4f1822639fe9` | `58cb479` | Admin orders + polls + users-roles flipped to real backend |
| 2026-05-14 | partner-mod-panel | `620cfdbf-be6b-4470-8be0-35aeac8f88a7` | `c5fdf76` | Partner chat moderation panel (pin/delete/timeout) |
| 2026-05-12 | predictions-pickem-flip | `e1de3493-336a-4b52-9b37-23354fe817d4` | `9f7c5d0` | Predictions + pickem 6 screens flipped |
| 2026-05-12 | channel-page + payouts | `632c3aa7-a82b-4ca7-bd63-a8e0e2b845db` | `979e294` | Public channel page + partner payouts screen |
| 2026-05-12 | channel-analytics | `3abcf4e8-2d22-40d7-ae75-6542b385ce25` | `df4b452` | Channel analytics screen with period switcher |
| 2026-05-12 | partner-dashboard-shell | `55c59304-f616-4cf6-a9d8-47fafd0049a8` | `7220f03` | Partner dashboard + channel home + stream-key rotate |
| 2026-05-12 | admin-settings-flags | `7ca929da-d82f-4d8d-8e1d-fab01688c844` | `2fdf12a` | Admin settings flags to real backend |
| 2026-05-12 | chat-sse-real | `00a98a5a-4d55-4dce-90a2-61f3481137c9` | `783d8c0` | Live chat wired to real backend via SSE |
| 2026-05-12 | tips-real | `32db6dfc-…` | `26fe81b` | Tips screen wired to real /api/tips backend |
| 2026-05-12 (later batches) | various splash + tab fixes | several | several | Splash animation rewrites, tab-tap fixes, SecureStore key fix |

## Backend-only deploys (no OTA)

| Date | Label | Commit | Highlights |
|---|---|---|---|
| 2026-05-15 | oembed | `d75657d` | /api/oembed for streams/VODs/clips — third-party embed cards (Twitter, Reddit, Discord). |
| 2026-05-15 | admin-foundation-A.4 | `21fc6a9` | Role grant API enforces canGrantRole. Audit every change. User.role enum expanded to full ladder. |
| 2026-05-15 | admin-foundation-A.2 | `ddb6fe0` | User sanctions table (suspend/ban/chat_banned) + session revocation + Better-Auth sign-in block hook. |
| 2026-05-15 | admin-foundation-A.1 | `80a90cf` | Soft-delete on streams/vods/clips + force-end live stream + audit log capture for each. Public lists filter deleted rows. |
| 2026-05-15 | admin-foundation-A | `03d6f84` | Role ladder (head_admin>admin>finance_admin>moderator>support_admin>premium>user>guest), admin_audit_log table, requireMinRole helper, canGrantRole policy. |
| 2026-05-15 | sentry-source-maps | `54db2f2` | withSentryConfig wired — readable stack traces in Sentry |
| 2026-05-15 | mobile-auth-bridge | `3c4c852` | /api/mobile-auth/{start,finish} for RN OAuth |
| 2026-05-15 | viewer-count-read-time | `24dc7f5` | Per-minute cron stripped (Hobby limit) → liveViewerCounts() reads from watch_events at query time |

## APKs (cloud + local)

| Date | Build # | File | Source | Highlights |
|---|---|---|---|---|
| 2026-05-14 | local | `app-release.apk` (94.77 MB) at repo root | Local gradle from `C:\Users\Sweez\evo` | First local APK (no EAS quota). Signed with `evotv-release.keystore`. Channel `preview`, OTA-eligible. |
| 2026-05-12 | EAS #13 | `ccHV9bWxXb3DLU7JS916B6.apk` | EAS cloud | Removed `@sentry/react-native` (RN 0.76 codegen incompat). Solid-black native splash. Replaces #11 as canonical. |
| 2026-05-12 | EAS #11 | `upCMW2kjfc18g7PsGLmP7Y.apk` | EAS cloud | Splash redesign, auth gate, EAS Update wired |
| 2026-05-12 | EAS #10 | `7LNdtjfeiLZWuhzuXGodbv.apk` | EAS cloud | Splash fade-in + entry animations |
| 2026-05-12 | EAS #9 | `9hFUphGkrpdfvpZvptKCvd.apk` | EAS cloud | Rewards real + profile/library tab fix |

## How to read this

- **Date** — when published
- **Label** — short human name for the OTA (`heartbeat-wired` > `1a0746ba`)
- **Update group ID** — what EAS prints; useful when matching crash reports back to a bundle
- **Commit** — the underlying git SHA the OTA bundle was built from
- **Highlights** — one-line summary of what changed

## When publishing a new OTA

1. Run the eas update command with a clear `--message`
2. Copy the resulting **Update group ID** + the date + a 1-line summary into a new row at the TOP of the OTA table above
3. Commit the RELEASES.md change

## Native APKs

Different cadence — only rebuild when:
- Native deps change (`pnpm add` with native module)
- `app.json` plugin/permission/splash/icon changes
- Expo SDK or RN version bumps
- Keystore changes

Everything else ships via OTA. Don't bump `versionName` in `app.json` until v1 launch.
