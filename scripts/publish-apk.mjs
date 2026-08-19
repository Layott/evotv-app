/**
 * Puts a built APK on the website.
 *
 * Until now every APK this project produced lived on one laptop. `/apps` could
 * only offer whatever `NEXT_PUBLIC_ANDROID_APK_URL` had been inlined with at
 * image build time, so publishing a build meant redeploying the website, and
 * nobody ever did. The page now reads the current release from the database at
 * request time, and this is what writes it.
 *
 * Two steps, both against the API rather than S3 directly:
 *
 *   1. Ask `/api/admin/uploads/client` for a presigned PUT and send the bytes
 *      straight to Spaces. The API never handles the 96 MB.
 *   2. POST the metadata to `/api/admin/app-releases`.
 *
 * Going through the API is deliberate: it means the machine that runs builds
 * needs no Spaces credentials, only an admin bearer token.
 *
 * Usage, from the app repo:
 *   node scripts/publish-apk.mjs builds/evotv-0.1.0-build197-0c82593.apk
 *
 * Wants two environment variables, which it will name if they are missing:
 *   EVOTV_API_BASE      https://api.evotv.co   (or http://localhost:3060)
 *   EVOTV_ADMIN_TOKEN   a bearer token for an admin account
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const notesFlag = args.indexOf("--notes");
/**
 * Free text stored on the release row, used to record where the binary came
 * from. `release-android.mjs` puts the EAS build id and artifact URL here, so
 * the file the website hands out can always be traced back to the build that
 * produced it rather than being taken on trust.
 */
const notes = notesFlag === -1 ? undefined : args[notesFlag + 1];
if (notesFlag !== -1) args.splice(notesFlag, 2);

const file = args[0];
if (!file) {
  console.error("usage: node scripts/publish-apk.mjs <path-to-apk> [--notes <text>]");
  process.exit(1);
}
if (!fs.existsSync(file)) {
  console.error(`no such file: ${file}`);
  process.exit(1);
}

/**
 * Credentials come from `.publish.env` beside the repo root, not the shell.
 *
 * Publishing needs an admin credential, and the obvious way to supply one is to
 * paste it into a command. That is the wrong shape for a secret: it lands in
 * shell history, in scrollback, and in any transcript of the session that ran
 * it. A gitignored file is read by the process that needs it and by nothing
 * else, so whoever runs the publish never has to hold the value in their hands.
 *
 * Format is plain `KEY=value` lines; `#` comments and blanks are ignored.
 */
function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), ".publish.env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    // Strip one layer of surrounding quotes, which people add out of habit.
    const value = trimmed.slice(eq + 1).trim().replace(/^["'](.*)["']$/, "$1");
    // The shell wins, so a one-off override is still possible.
    if (!process.env[key]) process.env[key] = value;
  }
}
loadEnvFile();

const base = (process.env.EVOTV_API_BASE ?? "").replace(/\/$/, "");

/**
 * An API key is the right credential here and a session token is not.
 *
 * `getCurrentUser()` on the backend falls back to `X-API-Key` when there is no
 * session, so a key issued at /api-access/keys authorises these routes exactly
 * as a signed-in admin would. Unlike a session token it is minted for this
 * purpose, it does not die when somebody signs out, and it can be revoked on
 * its own without ending anybody's login.
 *
 * The bearer path stays for whoever already has a token to hand.
 */
const apiKey = process.env.EVOTV_API_KEY;
const token = process.env.EVOTV_ADMIN_TOKEN;
if (!base || (!apiKey && !token)) {
  console.error(
    [
      "Not publishing: missing credentials.",
      "",
      "Create `.publish.env` in this repo (already gitignored) containing:",
      "",
      "  EVOTV_API_BASE=https://api.evotv.co",
      "  EVOTV_API_KEY=<admin API key from https://evotv.co/api-access/keys>",
      "",
      "An `EVOTV_ADMIN_TOKEN=<bearer token>` is accepted instead, but a key is",
      "better: it is revocable on its own and survives a sign-out.",
      "",
      "The APK is still built and sitting in builds/. Publishing is the only",
      "step that was skipped.",
    ].join("\n"),
  );
  process.exit(2);
}

/**
 * `evotv-0.1.0-build197-0c82593.apk` carries everything the release row needs,
 * which is the point of naming builds that way. Parsing the filename rather
 * than re-deriving from git means the row always describes the binary being
 * uploaded, even if the working tree has moved on since it was built.
 */
const name = path.basename(file);
const match = /^evotv-(.+?)-build(\d+)-([0-9a-f]+)(-dirty)?\.apk$/.exec(name);
if (!match) {
  console.error(
    `filename "${name}" is not in the expected form ` +
      "evotv-<version>-build<n>-<sha>.apk, so the release details cannot be read from it",
  );
  process.exit(1);
}
const [, version, buildNumber, commitSha, dirty] = match;
if (dirty) {
  console.error(
    "refusing to publish a -dirty build: it cannot be traced to a commit",
  );
  process.exit(1);
}

const bytes = fs.readFileSync(file);
const CONTENT_TYPE = "application/vnd.android.package-archive";

async function api(pathname, init = {}) {
  const res = await fetch(`${base}${pathname}`, {
    ...init,
    headers: {
      ...(apiKey ? { "X-API-Key": apiKey } : { Authorization: `Bearer ${token}` }),
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`${pathname} -> ${res.status} ${await res.text()}`);
  }
  return res.json();
}

console.log(`publishing ${name} (${Math.round(bytes.length / 1024 / 1024)} MB)`);

/*
 * A release has to have a higher build number than the one already up, and
 * this is worth failing on rather than discovering later.
 *
 * The site hands out whichever row has the highest build number, so a lower
 * one is simply invisible: the upload succeeds, the row is written, and the
 * download button carries on offering the old file. Android is stricter still
 * and refuses to install a lower versionCode over an existing app, so anybody
 * who did reach it would see "app not installed" with no reason given.
 *
 * It matters most when the source of build numbers changes. The local script
 * uses the commit count; EAS keeps its own counter, which starts at 1 unless
 * somebody sets it (`eas build:version:set`).
 */
const { releases } = await api(`/api/admin/app-releases?platform=android`);
const highest = releases?.[0]?.buildNumber ?? 0;
if (Number(buildNumber) <= highest) {
  console.error(
    [
      `refusing to publish build ${buildNumber}: the site already offers build ${highest}.`,
      "",
      "A lower build number would never be handed out, and Android would",
      "refuse to install it over the copy already on a phone.",
      "",
      "If this came from EAS, its counter is behind the local builds. Set it",
      `once with \`eas build:version:set\` to something above ${highest}.`,
    ].join("\n"),
  );
  process.exit(1);
}

const presign = await api("/api/admin/uploads/client", {
  method: "POST",
  body: JSON.stringify({
    pathname: `downloads/${name}`,
    contentType: CONTENT_TYPE,
  }),
});

/*
 * The Content-Type has to match exactly what was signed for, or Spaces rejects
 * the PUT with a signature mismatch that says nothing about the cause.
 *
 * `x-amz-acl` has to be sent as a header for the same practical reason. The
 * server signs the upload with `ACL: public-read`, but the SDK hoists
 * `x-amz-*` into the query string when presigning and Spaces does not apply the
 * ACL from there. The first published build proved it: the PUT returned 200, the
 * release row was written, /apps offered the link, and the download itself
 * answered 403 AccessDenied. A release nobody can download is worse than no
 * release, because the page claims it works.
 */
const put = await fetch(presign.uploadUrl, {
  method: "PUT",
  headers: { "Content-Type": CONTENT_TYPE, "x-amz-acl": "public-read" },
  body: bytes,
});
if (!put.ok) {
  throw new Error(`upload failed: ${put.status} ${await put.text()}`);
}
console.log(`uploaded to ${presign.publicUrl}`);

const { release } = await api("/api/admin/app-releases", {
  method: "POST",
  body: JSON.stringify({
    platform: "android",
    version,
    buildNumber: Number(buildNumber),
    commitSha,
    fileUrl: presign.publicUrl,
    sizeBytes: bytes.length,
    ...(notes ? { notes } : {}),
  }),
});

console.log(
  `published: version ${release.version}, build ${release.buildNumber}, ${release.commitSha}`,
);
console.log(`${base.replace(/^https:\/\/api\./, "https://")}/apps now offers it`);
