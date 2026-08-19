# Shipping an Android build

**The rule:** the APK on EAS and the APK on evotv.co are the same file. Not the
same commit, the same bytes. The build happens on EAS, and the website is given
that artifact.

Set by the owner on 19 August 2026, after a run of builds that existed only on
one laptop. Two builds of one commit are two different binaries, and when
somebody reports a bug against "the download" there has to be exactly one thing
that means.

```
pnpm release:android
```

That is the whole release. It builds on EAS, waits, downloads the artifact,
publishes it to the website, and pushes the matching OTA update.

## What it does, step by step

1. `eas build --platform android --profile preview --wait`. Nothing is compiled
   locally.
2. Downloads the finished artifact from EAS.
3. Renames it `evotv-<version>-build<n>-<sha>.apk` from the version, build
   number and commit **EAS recorded for that build**, not from the working
   tree.
4. `scripts/publish-apk.mjs` uploads it to Spaces and writes an `app_releases`
   row, with the EAS build id and artifact URL in the row's notes. `/apps`
   reads that row at request time, so the download changes with no redeploy.
5. `eas update --channel preview`, so phones already holding this
   runtimeVersion get the JavaScript without reinstalling.

## Before the first run

- `eas login` in your own terminal, or an `EXPO_TOKEN` in the environment. The
  script will not ask for a password and does not want to see one.
- `.publish.env` in the repo root (gitignored):
  ```
  EVOTV_API_BASE=https://api.evotv.co
  EVOTV_API_KEY=<admin API key from https://evotv.co/api-access/keys>
  ```
- **Set the EAS build number once.** Local builds numbered themselves from the
  commit count and reached 229. EAS keeps its own counter and starts at 1.
  A lower number is invisible on the site, which hands out the highest, and
  Android refuses to install it over a copy already on a phone. So:

  ```
  eas build:version:set --platform android
  ```

  and give it something above the highest build on `/apps`. `autoIncrement` on
  the `preview` profile carries it forward after that. `publish-apk.mjs` checks
  this and refuses rather than publishing a build nobody can install.

## Flags

| Flag | Effect |
|---|---|
| `--build-id <id>` | Publish an EAS build that already ran, instead of starting one |
| `--skip-update` | No OTA |
| `--skip-publish` | Build only, leave the website alone |
| `--profile <name>` | Build profile and update channel, default `preview` |

## What `pnpm apk` is for now

`scripts/build-apk-local.ps1` still exists and still works. It is for putting
something on a phone to look at, and its output is not a release: it numbers
itself from the commit count, which is a different counter from EAS's, and it
produces a binary EAS has never seen. Do not publish its output.

The one thing it is still needed for: `eas build --local` refuses to run on
Windows, so a build without EAS quota has to go through it.

## After a release

Walk the new build on a phone. The player controls, the admin sheets and
anything else drawn by the platform cannot be verified anywhere else, and the
web target proves nothing about them.
