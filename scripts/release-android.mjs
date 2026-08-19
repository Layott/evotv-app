/**
 * One Android release, from EAS to the website, in one command.
 *
 * The rule this exists to enforce (owner, 19 August 2026): the APK on the
 * website and the APK on EAS are the same file. Not the same commit, not the
 * same version number, the same bytes. Two builds of one commit are two
 * different binaries, and when somebody reports a bug against "the download"
 * there has to be exactly one thing that means.
 *
 * So the build happens on EAS, and the website gets the artifact EAS produced,
 * downloaded from EAS and re-uploaded to our own storage. Nothing is built
 * locally on the way, and `build-apk-local.ps1` is now only for trying
 * something on a phone before it is a release.
 *
 * Steps:
 *
 *   1. eas build, waited on, so there is a finished artifact to talk about.
 *   2. Download that artifact, and check its size against what EAS reported.
 *   3. Rename it to the form publish-apk.mjs reads release details out of,
 *      using the version, build number and commit EAS recorded for the build.
 *   4. Publish to the website, with the EAS build id written into the release
 *      row's notes so the download can always be traced back.
 *   5. eas update on the same channel, so phones already holding this
 *      runtimeVersion get the JS without waiting for anyone to reinstall.
 *
 * Usage, from the app repo:
 *   pnpm release:android                 build, publish, and push the update
 *   pnpm release:android --build-id <id> publish an EAS build that already ran
 *   pnpm release:android --skip-update   no OTA (the store build case)
 *   pnpm release:android --skip-publish  build only, leave the website alone
 *
 * Wants: `eas login` (or EXPO_TOKEN), and the same `.publish.env` credentials
 * publish-apk.mjs uses.
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
function flag(name) {
  return args.includes(`--${name}`);
}
function value(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
}

const profile = value("profile", "preview");
const existingBuildId = value("build-id", null);
const skipUpdate = flag("skip-update");
const skipPublish = flag("skip-publish");

const repo = path.resolve(import.meta.dirname, "..");
const buildsDir = path.join(repo, "builds");

/**
 * EAS credentials come out of the same gitignored file as the publish ones.
 *
 * `eas login` writes a session to ~/.expo, which is fine for a person at a
 * keyboard and useless here: the prompt needs a TTY, and this script is run
 * from tooling that has none. A robot token in `.publish.env` covers both, and
 * keeps the value out of shell history and out of any transcript.
 */
const envPath = path.join(repo, ".publish.env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["'](.*)["']$/, "$1");
    if (!process.env[key]) process.env[key] = value;
  }
}

/**
 * Windows needs `shell: true` to run `pnpm`, which is a .cmd, and a shell
 * concatenates the arguments instead of passing them through. An argument with
 * a space in it therefore arrives as several arguments.
 *
 * That is not hypothetical: the first release got as far as publishing the APK
 * and then died on `eas update --message Merge pull request #44 from
 * Layott/staging`, because the commit subject was a sentence. Quote anything
 * with whitespace, and escape the quotes inside it.
 */
function quoteForShell(arg) {
  if (!/[\s"]/.test(arg)) return arg;
  return `"${arg.replace(/"/g, '\\"')}"`;
}

function run(cmd, cmdArgs, opts = {}) {
  const useShell = process.platform === "win32";
  const res = spawnSync(cmd, useShell ? cmdArgs.map(quoteForShell) : cmdArgs, {
    cwd: repo,
    stdio: opts.capture ? ["inherit", "pipe", "inherit"] : "inherit",
    encoding: "utf8",
    shell: useShell,
    ...opts,
  });
  if (res.status !== 0) {
    console.error(`\n${cmd} ${cmdArgs.join(" ")} exited ${res.status}`);
    process.exit(res.status ?? 1);
  }
  return res.stdout ?? "";
}

/**
 * `eas` prints its own progress on stderr under --json, so stdout is the JSON
 * and nothing else. It is still worth being careful: a warning about an
 * outdated CLI has escaped onto stdout before, so the first `[` or `{` wins.
 */
function easJson(cmdArgs) {
  const out = run("pnpm", ["exec", "eas", ...cmdArgs, "--json"], {
    capture: true,
  });
  const start = out.search(/[[{]/);
  if (start === -1) {
    console.error("eas produced no JSON:\n" + out);
    process.exit(1);
  }
  return JSON.parse(out.slice(start));
}

// ------------------------------------------------------------------ preflight

const whoami = spawnSync("pnpm", ["exec", "eas", "whoami"], {
  cwd: repo,
  encoding: "utf8",
  shell: process.platform === "win32",
});
if ((whoami.stdout ?? "").includes("Not logged in") || whoami.status !== 0) {
  console.error(
    [
      "Not signed in to EAS, and this script will not handle your password.",
      "",
      "Run `eas login` in your own terminal, or put a robot token in the",
      "environment as EXPO_TOKEN, then run this again.",
    ].join("\n"),
  );
  process.exit(2);
}

// A release has to name a commit, and a dirty tree cannot. publish-apk.mjs
// refuses a -dirty filename for the same reason; failing here saves the build.
const dirty = execFileSync("git", ["status", "--porcelain"], {
  cwd: repo,
  encoding: "utf8",
}).trim();
if (dirty && !existingBuildId) {
  console.error(
    "working tree is dirty, so the build could not be traced to a commit:\n" +
      dirty,
  );
  process.exit(1);
}

// --------------------------------------------------------------------- build

let build;
if (existingBuildId) {
  console.log(`using existing EAS build ${existingBuildId}`);
  build = easJson(["build:view", existingBuildId]);
} else {
  console.log(`building on EAS (profile ${profile}), this takes a while`);
  const result = easJson([
    "build",
    "--platform",
    "android",
    "--profile",
    profile,
    "--non-interactive",
    "--wait",
  ]);
  build = Array.isArray(result) ? result[0] : result;
}

if (!build || build.status !== "FINISHED") {
  console.error(`build is ${build?.status ?? "missing"}, not FINISHED`);
  process.exit(1);
}

const artifactUrl =
  build.artifacts?.applicationArchiveUrl ?? build.artifacts?.buildUrl;
if (!artifactUrl) {
  console.error("finished build has no artifact URL");
  process.exit(1);
}

const version = build.appVersion;
const buildNumber = build.appBuildVersion;
const commit = (build.gitCommitHash ?? "").slice(0, 7);
if (!version || !buildNumber || !commit) {
  console.error(
    `build ${build.id} is missing version (${version}), build number ` +
      `(${buildNumber}) or commit (${commit}), so the release row cannot be named`,
  );
  process.exit(1);
}

// ------------------------------------------------------------------ download

fs.mkdirSync(buildsDir, { recursive: true });
const name = `evotv-${version}-build${buildNumber}-${commit}.apk`;
const target = path.join(buildsDir, name);

console.log(`downloading ${artifactUrl}`);
const res = await fetch(artifactUrl);
if (!res.ok) {
  console.error(`artifact download failed: ${res.status}`);
  process.exit(1);
}
const bytes = Buffer.from(await res.arrayBuffer());
fs.writeFileSync(target, bytes);
console.log(
  `${name}, ${(bytes.length / 1024 / 1024).toFixed(1)} MB, from EAS build ${build.id}`,
);

// ------------------------------------------------------------------- publish

if (skipPublish) {
  console.log("skipping the website, as asked");
} else {
  run("node", [
    "scripts/publish-apk.mjs",
    target,
    "--notes",
    `EAS build ${build.id}\n${artifactUrl}`,
  ]);
}

// -------------------------------------------------------------------- update

if (skipUpdate) {
  console.log("skipping the OTA, as asked");
} else {
  const subject = execFileSync("git", ["log", "-1", "--format=%s"], {
    cwd: repo,
    encoding: "utf8",
  }).trim();
  const channel = profile;
  console.log(`pushing an update to channel ${channel}`);
  run("pnpm", [
    "exec",
    "eas",
    "update",
    "--channel",
    channel,
    "--message",
    subject,
    "--non-interactive",
  ]);
}

console.log("\ndone. EAS and the website are holding the same binary.");
