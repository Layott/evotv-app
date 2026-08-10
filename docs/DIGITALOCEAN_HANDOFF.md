# DigitalOcean cold build: handoff

Written 2026-08-09. Companion to `DIGITALOCEAN_MIGRATION.md`, which is the plan. This file is the state: what exists, what is proven, what is still assumption, and what to do next.

**One paragraph.** All the code for moving EVO TV onto DigitalOcean is written, committed, and green on every check that can run without a DO account. Nothing is pushed, nothing is merged to `main`, and no DO resources exist. The app is not live and has nobody using it, which is why this is a cold build rather than a migration: no cutover, no rollback staging. The next move needs somebody logged into DigitalOcean.

---

## Update, 2026-08-10

Two decisions and one repair.

**Decisions.** Provision the full end state (droplet, backups, Managed Postgres, Spaces), roughly 54 USD per month, not a staged cheap start. And `evotv.co` is bought but **DNS stays put for now**, so the first build runs on a free `sslip.io` hostname with a real Let's Encrypt certificate. That matters more than it sounds: a bare droplet IP cannot get a certificate, and without HTTPS Better Auth's `secure` cookies never set, so login simply does not work. sslip.io buys a fully working stack to verify against before the domain moves.

**Repair.** `deploy/` was written on 2026-08-05 and never caught up with the code that landed on 08-07. Three real defects, all of which would have cost an hour each on the box:

1. `Caddyfile` served `evotv.tv`, a domain that never existed and was corrected in the plan on 08-06. Caddy would have sat in ACME backoff for hostnames nobody owns.
2. `docker-compose.yml` had **no `valkey` service**, so `REDIS_URL=redis://valkey:6379` pointed at nothing. It also still carried the "DO NOT add replicas" comment that commit `bb4d565` made obsolete.
3. One `api` container, so `deploy.sh` restarted in place and every deploy was a downtime window. The entire point of the Valkey work was two containers.

Now: four services (`api-1`, `api-2`, `valkey`, `caddy`), rolling restart in `deploy.sh` that waits on Docker health per container, and **hostnames read from `.env`** so the sslip.io to evotv.co flip is one edit plus `docker compose up -d caddy` rather than editing a file on a live box. Added `deploy/env.production.example` as the annotated source of truth for every value.

Verified, not assumed: `caddy validate` passes on both hostname sets; the adapted JSON shows all six certificate subjects, `health_uri /api/health` and `least_conn` on both routes, `flush_interval -1` on `/api/sse/*` only, and the `evotv.africa` 301; `docker compose config` resolves four services with caddy receiving only the six hostname vars and none of the secrets; `shellcheck` clean on both scripts; the runbook HTML checks clean at 15 sections, 29 code blocks each with exactly one copy button, 33 internal links resolving, no em dashes.

Still uncommitted, working tree only.

---

## Branches

Both repos are on a feature branch with a clean working tree. Nothing is pushed to any remote.

| Repo | Branch | Head |
|---|---|---|
| `GAMEEVO/EVOTV` (backend, Next 16) | `feat/digitalocean` | `bb4d565` |
| `GAMEEVO/EVOTV-app` (Expo) | `feat/digitalocean-uploads` | `d556d2f` |

Backend commits, oldest first:

| SHA | What |
|---|---|
| `1d8a5ba` | Docker + Caddy + cron scaffolding (written 2026-08-05, committed now) |
| `60103fd` | Neon HTTP driver to postgres-js, 7 files |
| `02eefb0` | DO Spaces adapter + the 3 routes that bypassed the storage seam |
| `bb4d565` | Valkey-backed SSE bus |

App commits, oldest first:

| SHA | What |
|---|---|
| `1e1fa6b` | The runbook, `.md` + `.html` |
| `0c31804` | Presigned PUT in `lib/api/uploads.ts` |
| `d556d2f` | Status note in the runbook |

`feat/digitalocean-uploads` was cut from `docs/do-cold-build`, so it already contains the docs commit. Merging the app branch brings the docs along. The `docs/do-cold-build` branch does not need merging separately.

---

## Verified, and not

Draw this line carefully. Everything below the line is assumption, however well-reasoned.

**Verified**

- `pnpm typecheck` clean in both repos.
- `pnpm test` in the backend: 46 passed, 3 files.
- `pnpm build` in the backend: full production build succeeds.
- The Valkey bus, against a real `valkey/valkey:8-alpine` container, in three configurations:
  - two separate processes, publisher and subscriber: all 3 payloads crossed
  - one process publishing and subscribing: delivered exactly once, not twice
  - no `REDIS_URL`: in-process fallback, exactly once
- The runbook HTML: tag nesting, 33 internal links resolving, 15 sections all reachable from nav, 27 code blocks each with exactly one copy button, no unescaped `<` inside code, no em dashes. Checker lives in the session scratchpad, not the repo; it is 60 lines of `html.parser` and is cheaper to rewrite than to find.

**Not verified**

- **Anything touching DO Spaces.** The adapter, the presigned PUT, the ACL headers, the content-type inference. Never pointed at a bucket.
- **Anything touching DO Managed Postgres.** postgres-js is exercised only in the sense that the app builds and the suite passes; it has never opened a connection to a real database, DO or Neon.
- **The RN upload path end to end.** `pnpm typecheck` only.
- **The runbook page rendering.** The Claude-in-Chrome extension reported "not connected" on three attempts across the session, so there is no desktop or mobile screenshot. The page opens in a browser; it has not been looked at by anything other than a parser.

---

## What needs you

Nothing further can be proven without these. Roughly 30 minutes in the DO control panel.

1. **Droplet.** `s-2vcpu-4gb-amd`, FRA1, Ubuntu 24.04 LTS, SSH key at create time, enable monitoring + IPv6 + weekly backups + **VPC**.
2. **Reserved IP**, attached to it.
3. **Managed Postgres**, smallest tier, **same VPC**. Copy both connection strings: direct (25060) and pool (25061).
4. **Spaces bucket** `evotv-media`, same region, **CDN enabled**. Generate an access key + secret.
5. **Cloud Firewall**: inbound TCP 22, 80, 443 only.
6. **Trusted Sources** on the database: add the droplet, so nothing else on the internet can reach it.
7. **DNS, deferred.** Build on `sslip.io` first. When the domain moves it is two Cloudflare zones: `evotv.co` (apex, `www`, `app` proxied; `api` grey) and `evotv.africa` (apex + `www`, proxied, redirect only).

Then hand over: the Reserved IP, the Postgres pool URI, and the four `SPACES_*` values.

One thing to check while you are in there: **which PostgreSQL major version Neon runs.** The droplet's `pg_dump` has to be at least that version or it refuses to dump, and Ubuntu 24.04 ships the 16 client by default.

---

## Resume sequence

Start at whichever step is not yet true.

```bash
# 1. confirm where things are
cd GAMEEVO/EVOTV     && git log --oneline -4   # expect bb4d565 on feat/digitalocean
cd GAMEEVO/EVOTV-app && git log --oneline -3   # expect d556d2f on feat/digitalocean-uploads

# 2. re-run the gate before changing anything
cd GAMEEVO/EVOTV && pnpm typecheck && pnpm test && pnpm build
cd GAMEEVO/EVOTV-app && pnpm typecheck
```

3. **Point the code at real DO services** and exercise what has never run: a `pnpm db:migrate` against Managed Postgres, an admin thumbnail upload landing in Spaces with a correct content type, and an RN video upload through the presigned PUT.
4. **Write the Blob to Spaces copy script.** Not written yet. See open items.
5. Then the runbook takes over from its step 4 (the files) onward.

---

## Environment

Carried over unchanged from the Vercel project, via `vercel env pull` once, then archived off the droplet: `PLAYOUT_SECRET` (**must not change**), `CRON_SECRET`, `AUTH_SECRET` (that name, not `BETTER_AUTH_SECRET`), SMTP credentials, OAuth client secrets.

New or changed:

```ini
BETTER_AUTH_URL=https://api.evotv.co
ALLOWED_ORIGINS=https://app.evotv.co,https://evotv.co,https://www.evotv.co
DATABASE_URL=postgresql://...@private-db-...:25061/defaultdb?sslmode=require
SPACES_REGION=fra1
SPACES_BUCKET=evotv-media
SPACES_KEY=...
SPACES_SECRET=...
SPACES_CDN_URL=https://evotv-media.fra1.cdn.digitaloceanspaces.com
REDIS_URL=redis://valkey:6379
```

Dropped once the copy is verified: `BLOB_READ_WRITE_TOKEN`, `POSTGRES_URL`.

Two things the code keys off, worth knowing because they are the rollback switches:

- `SPACES_KEY` set means Spaces is the active store. Unset it and the Blob adapter takes over again, no deploy needed.
- `REDIS_URL` set means the Valkey bus. Unset it and the bus falls back to the in-process EventEmitter, which means one container only.

---

## Landmines

Things that will cost an hour each if forgotten.

- **`server-only` blocks any script that imports `lib/sse/bus.ts` outside Next.** Run with `NODE_OPTIONS=--conditions=react-server`, which is the condition Next itself uses to resolve that package to a no-op.
- **`prepare: false` is required** while `DATABASE_URL` points at the pooler port. Transaction-mode pooling and named prepared statements do not coexist.
- **Every DB script needs `sql.end()`.** postgres-js keeps the event loop alive, so a script that succeeds still hangs. All 7 have it; a new one will not.
- **A presigned PUT signs `Content-Type` and `x-amz-acl`.** The client must echo both exactly or S3 answers `SignatureDoesNotMatch`. `presignPut` returns the headers to use; do not hand-roll them.
- **The one-container rule is lifted, but only once `REDIS_URL` is set.** Two `api` containers with an unset `REDIS_URL` is silent message loss, not an error.
- **`PLAYOUT_SECRET` must not change**, or the office media agent and the schedule page file browser break.
- **`api` stays grey-clouded** on Cloudflare, or its ~100s idle timeout kills every SSE stream on a loop.
- **Delete the Neon project last**, and not on the same day as anything else. It is the only copy of the waitlist that is not on hardware set up this week.
- **Dump the waitlist before touching anything.** It is the only irreplaceable data: real double opt-in signups with reserved usernames.

---

## Open items

Known-incomplete, deliberately. None of these block provisioning.

1. **The Blob to Spaces copy script does not exist.** Vercel Blob has no S3 API so `rclone` cannot mirror it. Shape is `list()` from `@vercel/blob`, fetch each URL, `PutObjectCommand` at the same pathname. Check the object count first: if the store holds only the logo and a few test uploads, skip the script and re-upload by hand. Same pathnames on both sides is what keeps the DB rewrite a pure host `replace()`.
2. **`viewerCounts` in `app/api/sse/stream/[id]/route.ts` is a per-process Map.** With two `api` containers the live viewer count splits until the 5-minute cron recomputes it. Needs its own change: a Valkey set, or accept the cron as the source of truth.
3. **The logo is hardcoded to a Vercel Blob URL in 5 files across 3 repos** (`EVOTV-app/components/home/top-navbar.tsx`, `EVOTV/components/home/top-navbar.tsx`, `EVOTV-WEBSITE/src/components/ui/waitlist-hero.tsx`, `.../legal-page.tsx`, `.../landing.tsx`). Commit it as a local asset rather than re-hosting it.
4. **The paranoia guard in `scripts/purge-fake-content.ts` still runs before `BEGIN`**, leaving a small check-then-act window. Now fixable, since the script uses a real interactive transaction; move the guard inside the `begin` callback. Left alone because the script has already done its job.
5. **Nothing is pushed.** Both branches are local only.
6. **`vercel.json` is still in the backend repo**, correctly. It is what schedules the four cron jobs while Vercel is still serving. Deleting it early plus any push to `main` drops them silently. It goes in step 9 of the runbook, after DNS moves.

---

## Bugs caught during the build

Recorded because each one is a thing that looked fine and was not. Full detail in the commit messages.

1. `db.execute()` returns the row array on postgres-js, not `{ rows }`. Would have made the viewer-count cron report 0 streams refreshed forever. Caught by tsc.
2. Scripts hang after succeeding without `sql.end()`.
3. `db/seed.ts`'s production guard matched only `.neon.tech` and `vercel-storage.com`. A DO host matches neither, so the guard would have silently disarmed and let demo telemetry into production on the first post-migration seed.
4. `PutObject` without `ContentType` stores as octet-stream, so browsers download images instead of rendering them.
5. Presigned PUT signature covers ACL and Content-Type.
6. `sseStream` returned its cleanup function from `start()`, which the streams spec ignores, so the heartbeat and subscription outlived the connection. Dead code today (`void sseStream`), so nothing leaked in production.

One place the plan was wrong: it said to delete the `public.blob.vercel-storage.com` guards in the avatar route. That would have aimed deletes at external avatar hosts and at a store the active client cannot reach. They became `ownedKeyFromUrl()` in `lib/storage/index.ts` instead, which returns null for a foreign host or for the non-active backend.

---

## Files touched

Backend (`EVOTV`):

```
lib/db/index.ts                          postgres-js client, pooled, HMR-safe
db/migrate.ts                            postgres-js migrator, max: 1, sql.end()
db/seed.ts                               driver + prod-host guard + sql.end()
db/seed-channel-keys.ts                  driver + sql.end()
db/backfill-tenancy.ts                   driver + sql.end(), client named `client`
scripts/purge-fake-content.ts            real interactive transaction
scripts/inventory-fake-seeds.ts          sql.query -> sql.unsafe
lib/analytics/rollup.ts                  db.execute result shape, 3 sites
app/api/cron/viewer-count/route.ts       db.execute result shape
lib/storage/spaces.ts                    NEW, S3 adapter + presignPut/presignGet
lib/storage/index.ts                     adapter selection + ownedKeyFromUrl()
app/api/admin/uploads/route.ts           storage.write()
app/api/admin/uploads/client/route.ts    presigned PUT, Blob kept as fallback
app/api/users/me/avatar/route.ts         storage.*, ownedKeyFromUrl()
lib/sse/bus.ts                           Valkey pub/sub + sseStream leak fix
package.json                             +postgres +ioredis +@aws-sdk/client-s3
                                         +@aws-sdk/s3-request-presigner
```

Backend `deploy/`, 2026-08-10, uncommitted:

```
deploy/docker-compose.yml                api-1 + api-2 + valkey + caddy
deploy/Caddyfile                         hostnames from env, lb + health_uri
deploy/deploy.sh                         rolling restart, per-container health
deploy/env.production.example            NEW, annotated env template
deploy/cron.sh                           comment only (evotv.tv -> evotv.co)
deploy/README.md                         rewritten for the four-service stack
```

App (`EVOTV-app`):

```
lib/api/uploads.ts                       requestDirectUpload + putFileToPresignedUrl
docs/DIGITALOCEAN_MIGRATION.md           the plan
docs/DIGITALOCEAN_MIGRATION.html         same, as a page
docs/DIGITALOCEAN_HANDOFF.md             this file
```
