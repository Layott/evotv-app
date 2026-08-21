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

## Signing

Cloud builds sign with **the same keystore the local script uses**, not one EAS
generates. That is not a preference: an APK signed with a different key cannot
install over the copy already on a phone, and Android reports it as "app not
installed" with no reason given.

`eas.json` sets `credentialsSource: local` on the preview profile, and
`credentials.json` (gitignored) points at `evotv-release.keystore` in the repo
root. Both the keystore and that file stay out of git.

The practical consequence: a release can only be cut from a machine holding the
keystore. That is this one. If it has to move, copy `evotv-release.keystore` and
recreate `credentials.json`; do not let EAS generate a new key.

Fingerprint of the key every build so far has used:
`62:FE:7A:B1:0A:BC:FE:BF:9F:FC:AE:2C:A0:2D:00:6E:00:41:E3:0A:CD:04:44:6B:6C:E4:DD:BF:4F:D5:DA:46`

## Size

A release APK should be about **55 MB**. If one comes out near 100 MB, it has
all four ABIs in it and the emulator halves are riding along.

`expo prebuild` writes all four architectures every time, and the local build
script patched them out, which helped only the builds that script made. The
first cloud build came out at **99.4 MB** for exactly that reason. It is now a
config plugin, `plugins/with-phone-abis.js`, so prebuild produces the right
list wherever it runs.

Check the number the release prints before walking away from it.

## Merges publish themselves

`.github/workflows/ota.yml` runs on every push to `main`. A JS-only merge is
typechecked and pushed as an OTA to the `preview` channel with the commit
subject as its message, so a fix reaches phones without anybody remembering to
send it.

Set by the owner on 20 August 2026, after the VOD comment thread shipped to
nobody: the fix was merged, correct, and on no phone, because publishing was a
thing a person had to decide to do.

**What it will not do.** If the merge touches `app.json`, `app.config.*`,
`eas.json`, `package.json`, `pnpm-lock.yaml`, `android/`, `ios/` or `plugins/`,
it stops and says so in the run summary. Those decide what the binary contains,
and an OTA would hand an installed app a bundle expecting native code it does
not have. That case is still `pnpm release:android`.

**The CLI is a devDependency**, so `pnpm exec eas` is the same binary at the
same version here and in CI, pinned by `pnpm-lock.yaml` rather than by two
hand-typed version numbers. It used to be a global install on the owner's
machine and nothing in the repo, which is how the first CI run with a real
token died on `Command "eas" not found`.

**Escape hatch.** Put `[skip ota]` in the merge subject.

**By hand.** `gh workflow run "OTA on merge" --repo Layott/evotv-app` publishes
whatever `main` holds right now: for a merge that landed before the workflow
existed, or one skipped and wanted after all.

**It needs one secret**, set once:

```
gh secret set EXPO_TOKEN --repo Layott/evotv-app
```

The same robot token `.publish.env` holds. Without it the run fails loudly
rather than quietly doing nothing.
