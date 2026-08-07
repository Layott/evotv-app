# EVO TV on DigitalOcean: build it cold

Nothing is live. Nobody is using it. So this is not a migration, it is a build.

No cutover choreography. No TTL lowering. No 3am write window. No rollback plan. No leaving Vercel warm for a week. Build the whole stack on DO, move the one table that matters, point DNS at it, delete the Vercel project.

Written 2026-08-05. Rewritten 2026-08-06 for **`evotv.co`** (primary) and **`evotv.africa`** (redirect), and for the fact that there is nothing to protect.

**One focused day.** Roughly 4 hours of code, 2 hours of infrastructure, 1 hour of data, 1 hour of walking the app.

---

## What has to survive

This is the whole risk surface. Everything not on this list is disposable, and treating it as disposable is what makes this a one-day job.

| Thing | Why | If lost |
|---|---|---|
| **`waitlist` rows** | Real pre-launch signups. Double opt-in, verified emails, reserved usernames | **Irreplaceable.** Cannot re-collect. Dump this first, before touching anything |
| **`PLAYOUT_SECRET`** | Office media agent and the schedule page file browser authenticate with it | Office playout box goes dark until you update it there too |
| **Admin accounts** | Your own logins | Annoying. Re-creatable via seed |
| **Shows / schedule config** | The playout scheduling, filler and ad-break config you built in `/admin/schedule` | Re-enterable by hand, but it is real work |
| Everything else | Schema lives in drizzle migrations. Content rows were already purged in June | Nothing. Let it go |

Take the safety dump before step 1, not after:

```bash
pg_dump --no-owner --no-acl -Fc "$NEON_URL" -f evotv-preflight.dump
```

Put it somewhere that is not the droplet you are about to build. That single file is the entire rollback plan, and it is enough, because there is no live traffic to reconcile against.

---

## Because nothing is live, do it properly the first time

The old plan carried a permanent constraint: **one `api` container, ever**, because `lib/sse/bus.ts` is an in-process `EventEmitter` and a second container cannot see the first's events. That constraint exists only to avoid rewriting the bus during a live migration.

There is no live migration. So rewrite the bus now, in the same day, and never live with it. Two hours of work buys two `api` containers and zero-downtime deploys from day one, instead of a footgun you have to defuse later under pressure.

Same logic for Spaces and Managed Postgres. Do not stand up Neon-and-Blob-on-a-droplet and promise yourself you will finish later. Build the end state.

---

## The end state

| Runs where | What | USD / month |
|---|---|---|
| **DO droplet** | 2 x `api`, `caddy`, `valkey`, marketing site, app web SPA, TLS | 28 + 6 backups |
| **DO Managed Postgres** | database, daily backups, 7 day point in time restore | 15 |
| **DO Spaces + CDN** | uploads, avatars, thumbnails, VOD files | 5 |
| **Vercel** | nothing. Project deleted | 0 |

Roughly **54 USD per month**. About 39 if you run Postgres in a container on the droplet instead, at the cost of owning backups forever. Managed is worth 15 here specifically because the waitlist lives in it.

Native iOS / Android are unaffected. They ship via EAS regardless of host. Only `EXPO_PUBLIC_API_BASE_URL` changes.

---

## 1. Provision all three at once

Same region, same VPC, same afternoon. Managed Postgres over the VPC private network is free bandwidth and sub-millisecond. Over the public endpoint it is neither.

### Droplet

| Setting | Value |
|---|---|
| Size | **2 vCPU / 4 GB / 80 GB**, Premium AMD (`s-2vcpu-4gb-amd`), roughly 28 USD per month |
| Region | **FRA1**. DO has no African region. Around 100 ms from Lagos, same as everything else you have |
| OS | **Ubuntu 24.04 LTS** |
| Auth | **SSH key**, added at create time. Never a root password |
| Enable | Monitoring, IPv6, weekly backups, **VPC** |

4 GB plus the swap file in step 2 is enough. Next 16 builds peak around 3 GB. Two `api` containers idle at maybe 300 MB each, so the ceiling is the build, not the runtime.

Add a **Reserved IP** and point DNS at that, so you can rebuild the droplet without touching DNS.

### Managed Postgres

Smallest tier, 1 vCPU / 1 GB / 10 GB, same VPC. Grab both connection strings: direct (25060) and pool (25061). You want the pool.

### Spaces

Bucket `evotv-media`, same region, **CDN enabled**. Generate a Spaces access key and secret. Spaces is S3-compatible, so everything downstream is the AWS SDK.

---

## 2. Droplet setup

On Windows, generate a key and create the droplet with it:

```powershell
ssh-keygen -t ed25519 -C "evotv-prod" -f $env:USERPROFILE\.ssh\evotv_prod
Get-Content $env:USERPROFILE\.ssh\evotv_prod.pub | Set-Clipboard
```

Paste into the DO create screen. Then `C:\Users\Sweez\.ssh\config`:

```
Host evotv
    HostName <RESERVED_IP>
    User root
    IdentityFile ~/.ssh/evotv_prod
    ServerAliveInterval 30
```

`ssh evotv`, then run this once:

```bash
# patch, timezone, swap
apt update && apt -y full-upgrade
timedatectl set-timezone Africa/Lagos
fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# docker
curl -fsSL https://get.docker.com | sh

# lock down ssh: keys only, no root password login
cat >/etc/ssh/sshd_config.d/99-evotv.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitEmptyPasswords no
MaxAuthTries 3
EOF
sshd -t && systemctl restart ssh

# auto security updates
apt -y install unattended-upgrades

# postgres client, for the data move in step 5
apt -y install postgresql-client-16
```

Then a **DO Cloud Firewall** in the control panel: inbound TCP 22, 80, 443 only. That is the firewall, no `ufw` needed on top. With password auth off, brute force cannot succeed, so `fail2ban` is optional noise-reduction rather than security.

Working as root here on purpose. A separate `deploy` user is better hygiene but is one more thing to get wrong, and this box has exactly one operator.

---

## 3. The code changes

Do these on a branch, before any data moves. Verify locally against the real DO Postgres and the real Spaces bucket. This is the only genuinely difficult part of the day, and it is much easier when no production traffic depends on getting it right first try.

### 3a. Postgres driver

Neon's HTTP driver is Neon-specific. DO Managed Postgres speaks the wire protocol, so this is `postgres-js`.

```bash
pnpm add postgres && pnpm remove @neondatabase/serverless
```

`lib/db/index.ts` today:

```ts
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
neonConfig.fetchConnectionCache = true;
const sql = neon(DATABASE_URL);
```

becomes:

```ts
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
const sql = postgres(DATABASE_URL, { ssl: "require", prepare: false, max: 10 });
```

`prepare: false` is required on the pooler port (25061, transaction mode). The `POSTGRES_URL ?? DATABASE_URL` fallback and the `globalThis.__evo_db` singleton both stay exactly as they are.

Six more files do the same import and need the same two-line swap:

```
db/migrate.ts                     also: drizzle-orm/neon-http/migrator -> drizzle-orm/postgres-js/migrator
db/seed.ts
db/seed-channel-keys.ts
db/backfill-tenancy.ts
scripts/purge-fake-content.ts
scripts/inventory-fake-seeds.ts
```

Free upgrade: `postgres-js` supports real interactive transactions. `scripts/purge-fake-content.ts` carries a comment working around what the Neon driver could not do. Delete the workaround.

### 3b. Spaces storage

```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

The seam already exists. `lib/storage/index.ts` picks an adapter by env, and `lib/storage/local.ts` defines the `StorageAdapter` interface that `lib/storage/blob.ts` implements.

| File | Change |
|---|---|
| `lib/storage/spaces.ts` | **new.** Implement `StorageAdapter` against S3: `PutObjectCommand`, `DeleteObjectCommand`, `HeadObjectCommand`, `ListObjectsV2Command`. Public URL is `${SPACES_CDN_URL}/${pathname}` |
| `lib/storage/index.ts` | select `spacesStorage` on `SPACES_KEY`. Delete the `blob.ts` branch entirely once the copy in step 5 is verified |

Three routes bypass the adapter and import `@vercel/blob` directly. They are the actual work:

| File | Change |
|---|---|
| `app/api/admin/uploads/route.ts` | `put()` becomes `storage.put()` |
| `app/api/admin/uploads/client/route.ts` | `handleUpload()` from `@vercel/blob/client` has no S3 equivalent. Replace the token exchange with a presigned `PUT` from `getSignedUrl()`. Keep the admin gate, the `MAX_BYTES` cap, and the response field names |
| `app/api/users/me/avatar/route.ts` | `put()` and `del()` become `storage.*`. The two `prev.includes("public.blob.vercel-storage.com")` guards can just go, since nothing will hold a blob URL after step 5 |

App side, `EVOTV-app/lib/api/uploads.ts` hand-rolls the Vercel Blob client protocol: a token exchange against `/api/admin/uploads/client`, then a `PUT` with Vercel's headers. Presigned S3 is strictly simpler. Ask the backend for a URL, `PUT` the bytes at it, done. Keep the `pickAndUploadVideo` return shape identical and `components/admin/vods-manager-page.tsx` needs no change at all.

One hardcoded Vercel Blob logo URL is pasted into five files across three repos:

```
EVOTV-app/components/home/top-navbar.tsx
EVOTV/components/home/top-navbar.tsx
EVOTV-WEBSITE/src/components/ui/waitlist-hero.tsx
EVOTV-WEBSITE/src/components/ui/legal-page.tsx
EVOTV-WEBSITE/src/components/landing.tsx
```

Commit the logo to each repo as a local asset and delete the constant. Serving a static logo from object storage was never right, and this is the cheapest moment to fix it.

### 3c. SSE bus on Valkey

`lib/sse/bus.ts` is a module-level `EventEmitter` behind a `globalThis.__evo_bus` singleton, feeding four SSE routes: chat, stream, party, notifications. One process only.

Valkey is the Redis fork DO ships. Run it as a service in the same `docker-compose.yml`, on the internal Docker network, never published to a host port.

Keep the exported `emit` and `subscribe` signatures byte-identical and no call site changes:

```
publisher:   one client, publish(topic, JSON.stringify(payload))
subscriber:  one client, psubscribe, fan out to local listeners
             exactly as the EventEmitter does today
```

This is what allows two `api` containers, which is what allows deploys with no downtime. It is also, quietly, a bug fix: on Vercel these four routes were already broken across instances, because an emit on one lambda was invisible to a subscriber on another.

---

## 4. The files

All live in the backend repo under `deploy/`, so they are version controlled and arrive with a `git pull`. The Dockerfile sits at the repo root.

```bash
mkdir -p /srv/evotv && cd /srv/evotv
git clone https://github.com/<you>/EVOTV.git api
mkdir -p web app
cp api/deploy/docker-compose.yml api/deploy/Caddyfile api/deploy/cron.sh api/deploy/deploy.sh .
chmod +x cron.sh deploy.sh
```

| File | What it does |
|---|---|
| `Dockerfile` (repo root) | full `node:22`, not slim, because `better-sqlite3` compiles native code |
| `docker-compose.yml` | `api` x2 on loopback, `caddy` on 80/443, `valkey` internal only |
| `Caddyfile` | TLS, both static sites, load balance across both `api` containers, SSE handling, `evotv.africa` redirect |
| `cron.sh` | replaces Vercel Cron, six jobs |
| `deploy.sh` | pull, build, migrate, rolling restart, health check |

Two Caddy settings matter:

- **`flush_interval -1`** on the SSE route. Without it Caddy buffers the stream and live chat looks frozen.
- **`health_uri /api/health`** on the reverse proxy upstreams, so a restarting container is taken out of rotation instead of serving 502s.

### Environment

The `.env` is now built by hand rather than pulled, since most values are changing and the Vercel project is about to be deleted. Pull once for the secrets worth keeping:

```bash
# on your laptop, in the backend repo
vercel env pull .env.vercel-archive
```

Keep from it: `PLAYOUT_SECRET`, `CRON_SECRET`, `BETTER_AUTH_SECRET`, SMTP credentials, any OAuth client secrets. Discard `DATABASE_URL`, `POSTGRES_URL`, `BLOB_READ_WRITE_TOKEN`.

Archive that file somewhere safe and off the droplet. Then write `/srv/evotv/.env` from the reference at the end of this document, and `chmod 600` it.

Do not shell-source `.env`. Values like `SMTP_FROM=EVO TV <noreply@evotv.co>` are unquoted, which Docker reads literally but bash parses as a redirect.

---

## 5. Move the data

Nothing is writing anywhere, so this is a copy, not a cutover. No stopping containers, no maintenance window, no reconciliation.

### Database

Choose one:

**Option A, full transplant.** Keeps admin accounts, API keys, channel stream keys, and everything configured in `/admin/schedule`.

```bash
# on the droplet, inside the VPC
pg_dump --no-owner --no-acl -Fc "$NEON_URL" -f /root/evotv.dump
pg_restore --no-owner --no-acl -d "$DO_POOL_URL" /root/evotv.dump
```

**Option B, clean room.** Fresh schema, waitlist only, everything else re-created by hand. Worth it if the current database has accumulated test junk you would rather not carry into launch.

```bash
pnpm db:migrate                                  # against DO, builds empty schema
pg_dump --no-owner --no-acl -t waitlist "$NEON_URL" | psql "$DO_POOL_URL"
```

Take A unless you have a reason. It is one command, and the June purge already removed the fake content.

Verify either way, table by table, before trusting it:

```sql
SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC;
```

Count `waitlist` on both sides explicitly. That is the number that matters.

### Objects

Vercel Blob has no S3 API, so `rclone` cannot see it. Write a one-shot script in the backend repo:

```
list() from @vercel/blob  ->  fetch each url  ->  PutObjectCommand to Spaces, same pathname
```

Same pathname on both sides is what makes the database rewrite a pure host swap. Find the columns first, do not guess:

```sql
SELECT table_name, column_name FROM information_schema.columns
WHERE column_name LIKE '%url%' AND table_schema = 'public';
```

Then one `UPDATE` per column:

```sql
UPDATE vods SET thumbnail_url = replace(thumbnail_url,
  'https://<storeId>.public.blob.vercel-storage.com/', 'https://evotv-media.fra1.cdn.digitaloceanspaces.com/');
```

If the Blob store turns out to hold nothing but the logo and a handful of test uploads, skip the script. Re-upload the few real files through the admin UI once the app is running and delete the rows pointing at the rest. Check before you build the tooling:

```bash
# how much is actually in there
node -e "require('@vercel/blob').list().then(r=>console.log(r.blobs.length))"
```

---

## 6. DNS

Two domains, two Cloudflare zones. **`evotv.co` is primary** and serves everything. **`evotv.africa` only redirects**, so the brand is protected without splitting SEO.

Zone `evotv.co`:

| Record | Type | Value | Cloudflare proxy |
|---|---|---|---|
| `evotv.co` | A | Reserved IP | proxied |
| `www` | A | Reserved IP | proxied |
| `app` | A | Reserved IP | proxied |
| `api` | A | Reserved IP | **DNS only (grey)** |

Zone `evotv.africa`:

| Record | Type | Value | Cloudflare proxy |
|---|---|---|---|
| `evotv.africa` | A | Reserved IP | proxied |
| `www` | A | Reserved IP | proxied |

Both `evotv.africa` records point at the same droplet. Caddy answers them with a permanent redirect, which also means Caddy issues certificates for them, which is required: a redirect still has to complete a TLS handshake first.

```caddyfile
evotv.africa, www.evotv.africa {
    redir https://evotv.co{uri} permanent
}
```

Keep `api` grey. Cloudflare's free tier drops idle proxied connections at around 100 seconds, which would silently kill every SSE stream on a 100-second loop.

Wait for DNS to resolve **before** starting Caddy, or certificate issuance fails and backs off. Six hostnames across two zones. Set them all now, then go do step 7 while they propagate.

---

## 7. Go live

```bash
cd /srv/evotv
docker compose up -d --build
docker compose logs -f caddy      # watch six certificates issue
```

Static sites, built on your laptop and copied up:

```powershell
pnpm --dir "C:\...\EVOTV-WEBSITE" build
scp -r "C:\...\EVOTV-WEBSITE\dist\*" evotv:/srv/evotv/web/

pnpm --dir "C:\...\EVOTV-app" expo export --platform web
scp -r "C:\...\EVOTV-app\dist\*" evotv:/srv/evotv/app/
```

Then walk it, on desktop and on a phone viewport:

1. `https://evotv.co` loads. `https://evotv.africa` redirects to it.
2. Log in as admin. Session survives a refresh.
3. Admin hub, then `/admin/schedule`. The playout file browser lists files from the office box, which proves `PLAYOUT_SECRET` survived.
4. Upload a thumbnail. Confirm the resulting URL is on the Spaces CDN host.
5. Open live chat in two browsers. A message in one appears in the other. That proves Valkey, and it is the check that would have been impossible to trust with a single container.
6. `docker compose restart api` mid-chat. The stream reconnects and nothing 502s, which proves the health check and both containers.
7. Waitlist signup on the marketing site, and confirm the mail actually arrives.
8. `SELECT count(*) FROM waitlist;` matches the pre-flight number.

---

## 8. Crons

`vercel.json` scheduled four jobs. Two more routes exist and have never run. Wire all six.

`/srv/evotv/cron.sh`:

```bash
#!/bin/bash
set -a; . /srv/evotv/.env; set +a
curl -fsS -m 600 -H "Authorization: Bearer $CRON_SECRET" \
  "http://127.0.0.1:3060/api/cron/$1"
```

```bash
chmod +x /srv/evotv/cron.sh
crontab -e
```

```cron
0  2 * * *  /srv/evotv/cron.sh analytics
0  3 * * 0  /srv/evotv/cron.sh payouts
0  4 * * 0  /srv/evotv/cron.sh gdpr-purge
0  5 * * *  /srv/evotv/cron.sh fantasy-score
*/5 * * * * /srv/evotv/cron.sh viewer-count
*/15 * * * * /srv/evotv/cron.sh reminders
```

Cron uses box time (Africa/Lagos). Vercel Cron used UTC, so these fire an hour earlier in absolute terms. Fine for all six, but know it.

---

## 9. Delete Vercel

Once step 7 passes, in this order:

1. Delete `vercel.json` and push. Nothing is scheduling those crons but the droplet now.
2. Remove `@vercel/blob` and `@neondatabase/serverless` from `package.json`.
3. Delete the Vercel project.
4. Delete the Blob store, once you have confirmed nothing 404s.
5. Delete the Neon project **last**, and not on the same day. It costs nothing to leave a free-tier database sitting there for a fortnight, and it is the only copy of your data that is not on hardware you set up this week.

Keep `evotv-preflight.dump` forever. It is 12 MB and it is the waitlist.

---

## 10. Deploying, after

```bash
ssh evotv /srv/evotv/deploy.sh
```

Pull, build, migrate, restart one `api` container, wait for its health check, restart the other. No downtime, because the bus is shared and Caddy takes the restarting container out of rotation.

Backups:

- **Managed Postgres**: daily, 7 day point in time restore. Automatic.
- **DO weekly droplet backups**: enabled at create time.
- **The `.env` file**: the only thing on the box that is not in git. Copy it somewhere safe once. Losing it means re-collecting a dozen secrets.

The droplet holds no data.

---

## Watch out for

- **Dump the waitlist before you touch anything.** It is the only irreplaceable thing in this document.
- **`PLAYOUT_SECRET` must not change**, or the office media agent and the schedule page file browser break.
- **`flush_interval -1`** in the Caddyfile or SSE buffers and chat looks frozen.
- **`api` stays grey-clouded** on Cloudflare, or SSE dies every 100 seconds.
- **DNS before Caddy**, or certificate issuance backs off. Six hostnames across two zones.
- **`prepare: false`** on the Postgres pooler port, or prepared statements break under transaction pooling.
- **Droplet, Spaces, and Postgres in one VPC**, or you pay for bandwidth and eat latency.
- **Same object pathnames** across the Blob to Spaces copy, or the URL rewrite stops being a host swap.
- **Two `api` containers only after the Valkey bus lands.** Order matters: bus first, then scale.
- **Swap file matters.** Next 16 builds peak near 3 GB on a 4 GB box.
- **Delete Neon last**, and later than everything else.
- Ubuntu 24.04 socket-activates SSH, so if you ever move off port 22 you must override `ssh.socket`, not just `sshd_config`.

---

## Env reference, end state

```ini
# core
BETTER_AUTH_URL=https://api.evotv.co
BETTER_AUTH_SECRET=<from the vercel archive>
ALLOWED_ORIGINS=https://app.evotv.co,https://evotv.co,https://www.evotv.co
PLAYOUT_SECRET=<from the vercel archive, unchanged, ever>
CRON_SECRET=<from the vercel archive>

# database, private VPC host, pooler port
DATABASE_URL=postgresql://...@private-db-...:25061/defaultdb?sslmode=require

# object storage
SPACES_REGION=fra1
SPACES_BUCKET=evotv-media
SPACES_KEY=...
SPACES_SECRET=...
SPACES_CDN_URL=https://evotv-media.fra1.cdn.digitaloceanspaces.com

# sse bus
REDIS_URL=redis://valkey:6379

# smtp, carried over unchanged
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=EVO TV <noreply@evotv.co>
```

`evotv.africa` is a redirect, so it never originates a browser request and does not belong in `ALLOWED_ORIGINS`.

No `BLOB_READ_WRITE_TOKEN`. No `POSTGRES_URL`. Nothing points at Vercel.
