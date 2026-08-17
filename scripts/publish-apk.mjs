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

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/publish-apk.mjs <path-to-apk>");
  process.exit(1);
}
if (!fs.existsSync(file)) {
  console.error(`no such file: ${file}`);
  process.exit(1);
}

const base = (process.env.EVOTV_API_BASE ?? "").replace(/\/$/, "");
const token = process.env.EVOTV_ADMIN_TOKEN;
if (!base || !token) {
  console.error(
    [
      "Not publishing: EVOTV_API_BASE and EVOTV_ADMIN_TOKEN are both required.",
      "",
      "  EVOTV_API_BASE=https://api.evotv.co",
      "  EVOTV_ADMIN_TOKEN=<bearer token for an admin account>",
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
      Authorization: `Bearer ${token}`,
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

const presign = await api("/api/admin/uploads/client", {
  method: "POST",
  body: JSON.stringify({
    pathname: `downloads/${name}`,
    contentType: CONTENT_TYPE,
  }),
});

// The Content-Type has to match exactly what was signed for, or Spaces rejects
// the PUT with a signature mismatch that says nothing about the cause.
const put = await fetch(presign.uploadUrl, {
  method: "PUT",
  headers: { "Content-Type": CONTENT_TYPE },
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
  }),
});

console.log(
  `published: version ${release.version}, build ${release.buildNumber}, ${release.commitSha}`,
);
console.log(`${base.replace(/^https:\/\/api\./, "https://")}/apps now offers it`);
