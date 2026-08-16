# Getting EVO TV onto iPhones

Written 2026-08-16. Android is done and downloadable from the site; this is
what iOS needs and what only the account holder can do.

## The one blocker

**An Apple Developer Program membership, 99 USD a year.** There is no way
around it: TestFlight, ad-hoc installs and the App Store all require it, and
Apple will not let a third party enrol on your behalf. Everything else below is
already prepared.

Enrol at <https://developer.apple.com/programs/>. As a company it asks for a
D-U-N-S number, which can take a few days to obtain, so start that first if the
account is going to be in the company's name rather than a personal one. A
personal account can be upgraded later, but the app has to be transferred, so
decide once.

## What is already done

- `bundleIdentifier` is `com.evotv.app`, matching Android.
- `ITSAppUsesNonExemptEncryption: false` is set, which removes the export
  compliance question from every single submission.
- Background audio is declared, so playback continues when the screen locks.
- **App Transport Security was disabled app-wide** (`NSAllowsArbitraryLoads`).
  Apple asks why, and there was no reason: everything the app talks to is
  HTTPS. Narrowed to `NSAllowsLocalNetworking` on 2026-08-16, which keeps dev
  builds able to reach a laptop on the same network.
- `eas.json` has an `ios-simulator` profile, which builds without any Apple
  account and proves the native project compiles.

## The steps, in order

1. **Enrol** in the Apple Developer Program and note the **Team ID**.
2. **Create the app record** in App Store Connect: My Apps, new app, platform
   iOS, bundle id `com.evotv.app`. Note the numeric **App ID** it gives you;
   that is `ascAppId`, and it is not the bundle identifier.
3. **Create an App Store Connect API key** (Users and Access, Integrations,
   App Store Connect API, key with the **App Manager** role). Download the
   `.p8` once, because it cannot be downloaded twice. This is what lets builds
   and submissions run without anybody typing an Apple password.
4. **Build**: `eas build --platform ios --profile production`. EAS creates the
   distribution certificate and provisioning profile itself the first time.
5. **Submit**: `eas submit --platform ios --latest`. The build appears in
   TestFlight after Apple finishes processing, usually well under an hour.
6. **Internal testing** starts immediately for up to 100 people on your team,
   no review. **External testing**, up to 10,000 people by email or a public
   link, needs a short Beta App Review, usually a day.

## What to expect from review

Two things reviewers reliably ask about an app like this:

- **A demo account.** Give them one in App Store Connect that can actually
  watch something, or the app looks empty and gets rejected as incomplete.
- **What the subscription buys.** If the app ever sells the premium tier
  in-app, Apple requires their in-app purchase and takes a cut. Selling it on
  the website and letting the app read the entitlement is allowed; linking to
  the website from inside the app to buy is where the rules get specific.
  Worth deciding before submitting rather than after a rejection.

## Where the naming is set

`app.json` holds the display name, version and bundle identifier. Version
`0.1.0` is what a TestFlight build reports; `eas.json` sets `appVersionSource`
to remote, so the build number increments on EAS and does not need touching by
hand.
