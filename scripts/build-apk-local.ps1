# Build a release APK on this Windows machine, without EAS cloud quota.
#
# `eas build --local` refuses to run on Windows ("macOS or Linux is required"),
# so this does what it would have done: prebuild the android project, re-apply
# the two patches prebuild wipes, and run gradle.
#
# It builds from C:\Users\Sweez\evo rather than from the repo, and that is not a
# preference. CMake encodes the absolute source path into its own output paths,
# which roughly doubles their length; from the repo's real location that crosses
# Windows' 260-character limit and react-native-reanimated dies with a ninja
# mkdir error. `subst` and junctions both fail here because CMake resolves them
# back to the physical path. A genuinely short path is the only fix.
#
# Usage:  pnpm apk         (from the repo root)

$ErrorActionPreference = "Stop"

$Repo  = "C:\Users\Sweez\Desktop\LAYO\CLAUDE\GAMEEVO\EVOTV-PLATFORM\EVOTV-app"
$Build = "C:\Users\Sweez\evo"
$Node20 = "$env:USERPROFILE\.config\herd\bin\nvm\v20.18.1"
$Ndk = "27.1.12297006"

function Step($msg) { Write-Host "==> $msg" }

# ---------------------------------------------------------------- sync
Step "syncing $Repo -> $Build"
# node_modules is excluded so pnpm reinstalls cleanly: copied pnpm symlinks
# point at store paths that do not resolve from the new root.
#
# /PURGE is not optional. Without it robocopy only ever adds, so a file deleted
# from the repo lives on in the build copy and ships in every APK afterwards.
# That is not hypothetical: `app/(public)/api-access` was deleted in June 2026
# and was still in the 15 August build, where Expo Router turned its four
# routes into four extra tabs, which is why the tab bar was unusable on a
# phone. Excluded directories are exempt from the purge, so android/ and
# node_modules/ survive and the incremental build stays fast.
#
# The generated directories are excluded by FULL PATH, not by name. A bare
# `/XD android` matches every directory called android at any depth, which
# quietly dropped `app/(public)/apps/android` - a real route - out of every APK
# ever built by this script. `.git` and `node_modules` stay name-matched, since
# a nested one should always be skipped.
robocopy $Repo $Build /E /PURGE `
    /XD .git node_modules "$Repo\.expo" "$Repo\dist" "$Repo\android" "$Repo\graphify-out" `
    /XF "*.log" /MT:16 /NFL /NDL /NJH /NJS | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed with $LASTEXITCODE" }

# Belt and braces: the copy must contain exactly the routes the repo contains.
# A mismatch means the sync is not doing its job, and the only symptom in the
# built app is a screen that should not exist.
$repoRoutes  = (Get-ChildItem "$Repo\app"  -Recurse -Filter "index.tsx" | Measure-Object).Count
$buildRoutes = (Get-ChildItem "$Build\app" -Recurse -Filter "index.tsx" | Measure-Object).Count
if ($repoRoutes -ne $buildRoutes) {
    throw "the build copy has $buildRoutes routes and the repo has $repoRoutes; refusing to build a stale bundle"
}
Step "synced, $repoRoutes routes match"

# ---------------------------------------------------------------- deps
Step "installing dependencies"
$env:CI = "true"          # or pnpm stops to ask for a TTY
Set-Location $Build
pnpm install --frozen-lockfile
if (-not $?) { throw "pnpm install failed" }

# Node 20 has to come first on PATH. Node 25's stdout buffering deadlocks the
# Groovy `.execute().text` calls inside android/build.gradle: gradle spawns
# node, node fills the pipe, both wait forever.
$env:Path = "$Node20;$env:Path"
Step "node $(node -v)"

# ---------------------------------------------------------------- prebuild
Step "prebuilding android/"
pnpm exec expo prebuild --platform android --clean --no-install
if (-not $?) { throw "expo prebuild failed" }

# ---------------------------------------------------------------- patches
# Both of these are wiped by every `prebuild --clean`, so they are re-applied
# here rather than committed into android/, which is generated.
Step "re-applying the NDK version and the release signing config"

$rootGradle = "$Build\android\build.gradle"
$text = [IO.File]::ReadAllText($rootGradle)
# The default 26.1 would be a second 1 GB NDK download for no benefit.
$text = [regex]::Replace($text, 'ndkVersion\s*=\s*"[\d\.]+"', "ndkVersion = `"$Ndk`"")
[IO.File]::WriteAllText($rootGradle, $text, (New-Object Text.UTF8Encoding $false))

$appGradle = "$Build\android\app\build.gradle"
# Normalised to LF before anything is matched. The anchors below are here-strings
# in this file, so they carry whatever line endings this file has, and git
# rewrites it to CRLF on checkout while Expo writes build.gradle with LF. That
# mismatch made every anchor miss and the guard refuse the build, which is the
# right failure but for an irrelevant reason.
$text = ([IO.File]::ReadAllText($appGradle)) -replace "`r`n", "`n"

# Exact anchors, not a `.*?` splice. A lazy match across this file happily runs
# from `signingConfigs {` into the `debug {` of `buildTypes` and swallows the
# brace between them, which produces a gradle file that still parses and is
# wired wrong.
# Anchors normalised to LF for the same reason as the file above.
$debugKey = (@"
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
"@ -replace "`r`n", "`n")
$withRelease = $debugKey + (@"

        release {
            storeFile file('../../evotv-release.keystore')
            storePassword 'evotvkey'
            keyAlias 'evotv'
            keyPassword 'evotvkey'
        }
"@ -replace "`r`n", "`n")

if ($text -notmatch [regex]::Escape("evotv-release.keystore")) {
    if ($text -notmatch [regex]::Escape($debugKey)) {
        throw "prebuild produced a signingConfigs block this script does not recognise"
    }
    $text = $text.Replace($debugKey, $withRelease)
}

# The release buildType, identified by the comment prebuild puts above it, so
# this cannot hit the `debug` buildType by accident.
$debugSigned = (@"
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug
"@ -replace "`r`n", "`n")
$releaseSigned = (@"
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.release
"@ -replace "`r`n", "`n")
if ($text -match [regex]::Escape($debugSigned)) {
    $text = $text.Replace($debugSigned, $releaseSigned)
}

[IO.File]::WriteAllText($appGradle, $text, (New-Object Text.UTF8Encoding $false))

$check = Get-Content $appGradle -Raw
if ($check -notmatch [regex]::Escape("signingConfig signingConfigs.release")) {
    throw "the release signing config did not apply; refusing to ship a debug-signed APK"
}
if ($check -notmatch [regex]::Escape("evotv-release.keystore")) {
    throw "the release keystore is not referenced; refusing to ship an unsigned APK"
}

# ---------------------------------------------------------------- version
# Every APK this script has ever produced declared `versionCode 1` and
# `versionName "0.1.0"`, because app.json sets no versionCode and eas.json puts
# `appVersionSource` on remote, which only applies to cloud builds. Two things
# were wrong with that. Android uses versionCode to decide whether an install is
# an upgrade, so every build looked like the same build. And naming the file
# after the version alone would have produced one filename for ever, each build
# silently overwriting the last, which is why these were dated instead.
#
# The commit count is the build number: monotonic, needs no state file to keep
# in sync, and unlike a counter it points at an exact commit. The short SHA goes
# in the filename so an APK on a phone can be traced back to the code in it.
#
# Note for the future: EAS cloud builds keep their own remote counter, so a
# cloud build's versionCode will not match these. Only this script's output is
# numbered this way.
Step "stamping the build number"
Push-Location $Repo
$BuildNumber = (git rev-list --count HEAD).Trim()
$ShortSha    = (git rev-parse --short HEAD).Trim()
$IsDirty     = [bool](git status --porcelain)
Pop-Location
if (-not $BuildNumber) { throw "could not read a commit count to use as the build number" }

$VersionName = (Get-Content "$Build\app.json" -Raw | ConvertFrom-Json).expo.version

$appGradleText = ([IO.File]::ReadAllText($appGradle)) -replace "`r`n", "`n"
$appGradleText = [regex]::Replace($appGradleText, 'versionCode\s+\d+', "versionCode $BuildNumber")
[IO.File]::WriteAllText($appGradle, $appGradleText, (New-Object Text.UTF8Encoding $false))

if ((Get-Content $appGradle -Raw) -notmatch "versionCode $BuildNumber") {
    throw "the build number did not apply; refusing to ship another APK numbered 1"
}
Step "version $VersionName, build $BuildNumber, commit $ShortSha$(if ($IsDirty) { ', working tree DIRTY' })"

# Prebuild writes `org.gradle.jvmargs=-Xmx2048m`, and 2 GB is not enough for
# `:app:collectReleaseDependencies` on this project: it died with "Java heap
# space" after eight minutes of work. Raised here rather than passed on the
# command line, because PowerShell splits a quoted `-Dorg.gradle.jvmargs=...`
# and gradle then reads the fragment as a task name.
$props = "$Build\android\gradle.properties"
$propsText = ([IO.File]::ReadAllText($props)) -replace "`r`n", "`n"
$propsText = [regex]::Replace(
    $propsText,
    'org\.gradle\.jvmargs=.*',
    'org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1g'
)
[IO.File]::WriteAllText($props, $propsText, (New-Object Text.UTF8Encoding $false))

# ---------------------------------------------------------------- build
Step "building"
# Stale daemons from an earlier run hold their heap and are not reused, which
# is how this machine ran out of memory mid-build in the first place.
Set-Location "$Build\android"
.\gradlew.bat --stop 2>&1 | Out-Null
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$Node20;$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:Path"

Set-Location "$Build\android"
.\gradlew.bat assembleRelease --console=plain --warning-mode=none
if (-not $?) { throw "gradle failed" }

# ---------------------------------------------------------------- collect
$apk = "$Build\android\app\build\outputs\apk\release\app-release.apk"
if (-not (Test-Path $apk)) { throw "gradle reported success but produced no APK" }

# Named for what is in it rather than when it was made: version, build number,
# and the commit. `-dirty` when the tree had uncommitted changes, because an APK
# that cannot be traced to a commit should say so on the tin.
$suffix = if ($IsDirty) { "-dirty" } else { "" }
$out = "$Repo\builds\evotv-$VersionName-build$BuildNumber-$ShortSha$suffix.apk"
New-Item -ItemType Directory -Force "$Repo\builds" | Out-Null
Copy-Item $apk $out -Force

$size = [math]::Round((Get-Item $out).Length / 1MB, 2)
Step "done: $out ($size MB)"
