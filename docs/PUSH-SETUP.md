# Push notifications: what is done, and the one thing that is not

Written 2026-08-16, after the whole path was traced end to end.

## Where it stands

| Leg | State |
|---|---|
| Website, browser push | **Working, proven.** Subscribe, announcement, reminder cron, opt-out, unsubscribe all verified in real Chrome against a real FCM endpoint |
| Server fan-out | **Working.** `/api/admin/announcements` and `/api/cron/reminders` write the notification row and send on both transports |
| App, registration code | **Written and correct.** `hooks/usePushTokenRegistration.ts` asks for permission, fetches the token, posts it to `/api/push/expo-token` |
| App, actual delivery to a handset | **Cannot work yet.** The project has no push credentials at all |

## The blocker, precisely

Two separate things are missing, and both need somebody with the Google and
Apple accounts. This is not a code change and no amount of testing on a phone
will get past it.

**Android.** Expo's push service delivers through Firebase Cloud Messaging.
That needs:

1. a Firebase project with an Android app whose package is `com.evotv.app`
2. `google-services.json` downloaded from it, committed to this repo, and
   referenced in `app.json` as `expo.android.googleServicesFile`
3. the FCM V1 service account JSON uploaded to EAS
   (`eas credentials -p android`, "Google Service Account Key for Push
   Notifications")

Without step 2 the device cannot register with FCM, and without step 3 the
Expo push service cannot send to it. Verified on 2026-08-16: there is no
`google-services.json` anywhere in this repo, `app.json` has no
`googleServicesFile`, and Expo's own API reports the project's
`androidAppCredentials` as an empty list.

**iOS.** Needs an Apple Developer account, an APNs key uploaded to EAS. Expo's
API reports `iosAppCredentials` as empty too. iOS also has no distribution
route outside the App Store or TestFlight, so this one waits on the same
account either way.

## How to tell it worked

After the credentials exist, rebuild (`pnpm apk`) and install on a real phone,
not an emulator: FCM registration needs Google Play services and a real device.

1. Sign in. Settings shows **Push on this device: On**. That row reads the
   real state, so anything else names the reason.
2. The token lands in the database:
   `select platform, left(token, 24), last_seen_at from expo_push_tokens;`
3. Send one from `/admin/announcements`, audience "just this person". The
   response reports `expoDelivered: 1`.

If step 1 says "This build cannot receive push", the credentials are still
missing or the build predates them. `console.warn` carries the underlying
message from expo-notifications.

## Why the failure used to be invisible

The registration hook swallowed every error, on the reasoning that push is
enrichment and must never block a sign-in. That reasoning is right and has not
changed. What it cost is that a build with no credentials looked exactly like
a working one. Failures are now recorded in `lib/push/state.ts`, warned to the
console, and shown in Settings, so the next person does not have to read three
repositories to find out that push was never going to work.
