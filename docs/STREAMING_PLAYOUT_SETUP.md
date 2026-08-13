# EVO TV — Streaming & Scheduled Playout Setup (Office → App)

> Plain-language launch guide. Written for someone who is NOT a streaming engineer.
> Goal: from a server in your office, broadcast video to the EVO TV app, with some
> content **pre-recorded but airing on a fixed schedule** (like a TV channel) and some
> **genuinely live** (esports). Covers what to buy, what to install, how to wire it to
> the EPG you already built, and what it all costs.
>
> Last updated: 2026-06-10.

---

## 0. The one idea that makes the rest make sense

> **Your office sends ONE copy of the video upward. A delivery network (CDN) makes thousands of copies and hands them to phones. Your office never talks to viewers directly.**

If you remember nothing else, remember that. It's why your office internet (which can upload maybe 20–100 Mbps) can serve 10,000 viewers: you only ever push **one ~6 Mbps stream** up; the multiplication is the CDN's job, not yours.

And the second idea, the one that answers your scheduling question:

> **"Streaming live" and "running a TV channel on a schedule" are TWO DIFFERENT JOBS, done by TWO DIFFERENT programs. OBS does the first. It cannot do the second. A "playout" program does the second.**

---

## 1. What you ALREADY have (the receiving end)

Good news: half the pipeline is already built and shipped in your backend (`../EVOTV`). You are NOT starting from zero.

Your app plays video in a standard internet-TV format called **HLS** — a playlist file ending in `.m3u8` that points at a string of short video chunks. The player is already there:
- Phone app: `components/stream/hls-player.tsx` (uses `expo-video`)
- Web: `components/stream/hls-player.web.tsx` (uses `hls.js`)

Each stream row in your database has a field **`hlsUrl`**. The app just plays whatever URL is in that field. That's the key seam — **whoever produces the video only has to hand you one `.m3u8` URL.**

Your backend also already has a way to *receive* live video the "traditional" way:
- An **RTMP ingest** server config (`infra/nginx-rtmp/nginx.conf`, `infra/docker-compose.yml`) listening on **port 1935**, application name **`live`**.
- A **stream key** system: keys look like `sk_live_<32 hex chars>` (`lib/video/stream-key.ts`), one per channel, stored hashed in the `channel_stream_keys` table.
- A **webhook** (`app/api/rtmp/on-publish/route.ts`) that fires the moment an encoder connects: it checks the stream key, creates/updates the stream row, sets **`isLive = true`**, and sets `hlsPath = /hls/<key>.m3u8`. A matching `on-publish-done` webhook sets `isLive = false` when the encoder disconnects.

So the receiving end understands: "an encoder connected with a valid key → mark this stream live → here's its HLS URL." **What's missing is the thing on the OTHER end that actually pushes video in — and a way to make it follow a clock.**

---

## 2. The big question answered: OBS, or our own software?

You need **both**, for two different situations. Here's the distinction nobody explains clearly:

| | **OBS** (live encoder) | **Playout software** (TV channel) |
|---|---|---|
| What it's for | "Stream these **live sources right now** — a camera, a game feed, a host on a mic." | "Make sure **the right file is on air at the right minute**, 24/7, with nobody in the room." |
| Driven by | A **human clicking** scenes | A **clock + a schedule** |
| Does it know it's 8:00pm? | **No.** OBS has no concept of "play this file at 8pm." | **Yes. That is its entire purpose.** |
| If a file ends and nothing's next? | Black screen / frozen frame | Auto-fills with filler, loops, never goes dark |
| Runs unattended overnight? | Not really | Yes — that's the point |

**The trap:** if you point OBS at an anime episode and hit "Start Streaming," it streams that episode **immediately** — not at 8pm — and when the episode ends, OBS just shows a frozen frame until a human does something. OBS is a *live switcher*. It streams whatever's on screen the moment you click. It does **not** watch a clock and swap pre-recorded files.

So:
- **For genuine live events** (an esports match, a host on camera switching between game feed / replays / scoreboard / chat) → **use OBS.** That's exactly what it's built for.
- **For your scheduled lineup** (anime episode at 8pm, overnight reruns, the daily "what's airing" grid — files that already exist and must hit exact times unattended) → **use a PLAYOUT engine.**

Both push video into the **same** ingest, the same way (RTMP + a stream key). They just take turns. More on the handoff in §5.

---

## 3. How to make videos ALWAYS run on schedule (the real answer)

### ⚠️ First, a gap you need to know about

Right now, your EPG / schedule (`scheduledStartAt` on a stream, the `/api/schedule` endpoint, the `/schedule` screen) is **metadata only.** It's a TV guide that *says* "Anime X airs at 8pm." But **nothing in your system actually starts a video playing at 8pm.** We verified this in the code:

- `scheduledStartAt` is read by exactly one place: the EPG query, to decide whether to draw a row as "scheduled / live / completed" based on the current clock.
- A stream only becomes **truly live** when an encoder physically connects and trips the `on-publish` webhook.
- There is **no cron, no trigger, no automation** that says "it's 8pm, start the anime."

So today, "on schedule" depends on a **human manually starting the broadcast at the right time.** That's fine for the occasional live event. It's a disaster for a 24/7 channel. **The playout engine is exactly the thing that closes this gap.**

### The fix: a playout engine — **ffplayout** (recommended)

**ffplayout** ([github.com/ffplayout/ffplayout](https://github.com/ffplayout/ffplayout)) is free, open-source playout software. It is the "brain" of a TV channel. You give it a **playlist for each day** (a list of files with start times), and it:

- **Follows the wall clock.** Every program has a computed start time. At runtime it compares the real time to those times and cues the right file. *(If you start it mid-day at 14:32 and the 14:00 movie is 90 min long, it doesn't restart the movie — it seeks ~32 minutes in, so you stay aligned to the clock.)*
- **Never goes dark.** If a file is shorter than its slot, or there's a gap, it inserts **filler** (a clip or a folder of clips) and loops it until the next slot. If nothing's configured, it makes a dummy clip. The stream never dies.
- **Handles "file too long / too short."** Each playlist item has `in` / `out` trim points so you fit content to its slot.
- **Outputs a continuous stream** it pushes as RTMP to your ingest — exactly like OBS would, just driven by a clock instead of a human.
- **Has a web UI + a REST API**, so you can drive it from your existing EPG.

It runs as a Linux service, web UI on **port 8787**, installs from a `.deb`/`.rpm` package.

> Note: the original ffplayout repo was archived in 2026 at **v1.1.0** — still fully working and the best-documented option; just no new upstream features. A maintained community fork, **FFplayoutX**, continues it. **Start with stock v1.1.0.**

### The golden rule: ONE schedule, two outputs

This is how you guarantee the app's TV guide matches what's actually on air:

> **`/api/schedule` is the single source of truth. Derive BOTH the on-screen EPG AND the playout playlist from it.**

```
                       ┌──► the EPG the app shows  (already built)
/api/schedule ─────────┤
 (single source)       └──► ffplayout's daily playlist  (small new adapter)
```

Because both come from the same data, they **cannot drift.** You write one small adapter (a daily cron job) that:
1. reads `/api/schedule` for tomorrow,
2. turns each program into `{ source: <file path or live URL>, in, out, duration }`,
3. `POST`s the list to ffplayout: `POST http://office-server:8787/api/playlist/{channelId}/`.

That single adapter is the whole "get the TV guide on air" integration.

### Closing the loop: ffplayout tells your app what's REALLY on

ffplayout has a **task** feature: it runs a script every time a program changes. Wire that script to call a small new backend endpoint (e.g. `/api/internal/now-airing`) so that **the instant a program actually goes on air, your backend flips `isLive` / current-program** and the app shows reality, not just the plan (covers the case where a live event ran long, or an operator skipped a clip).

---

## 4. Getting the video from the office to phones (the delivery chain)

### The chain, simply

```
[Office]                  [Ingest / Origin]         [CDN edge]           [Phone]
ffplayout or OBS  ─RTMP─►  catches ONE push   ─►  fans out to many  ─HLS─►  app
(one stream up)            repackages to HLS      servers worldwide          plays it
```

### Why you CANNOT serve phones straight from the office

One 1080p viewer needs ~5 Mbps of **download**. If the office served viewers directly, your office **upload** would have to equal everyone's download added up:

| Concurrent viewers @ 1080p | Office upload you'd need |
|---|---|
| 10 | 50 Mbps |
| **100** | **500 Mbps** ← impossible on office broadband |
| 1,000 | 5 Gbps |

A Lagos office line gives maybe 20–100 Mbps up, shared. 500 Mbps sustained is not happening.

**The fix — one stream up, CDN fans out:**

| What the office actually uploads | Bandwidth |
|---|---|
| One 1080p stream to the CDN | **~5–8 Mbps, constant — no matter how many viewers** |

100 viewers or 100,000 viewers → office still uploads **one ~6 Mbps stream.** That's the whole game.

### Recommended for your June launch: **Cloudflare Stream** (zero servers)

For launching this month at under ~100 concurrent viewers, **do not run your own origin server.** Use Cloudflare Stream. Your office pushes one stream to Cloudflare; Cloudflare transcodes it, records it, and delivers HLS worldwide. You manage **no servers.**

```
Office (ffplayout/OBS) ──RTMPS──► Cloudflare Stream Live Input ──HLS──► EVO TV app
```

Steps (full version in §6):
1. Cloudflare dashboard → **Stream → Live Inputs → Create Live Input** (recording: `automatic`).
2. It gives you an **RTMPS URL** (`rtmps://live.cloudflare.com:443/live/`) + a **stream key**.
3. It gives you an **HLS playback URL**: `https://customer-<CODE>.cloudflarestream.com/<INPUT_UID>/manifest/video.m3u8` — that's what goes into your app's `hlsUrl` field.
4. Every broadcast is **auto-recorded** into a replayable VOD.

**Important nuance:** Cloudflare Stream is **live passthrough only** — it has **no built-in scheduler.** It relays whatever you send it. That's fine, because **your scheduling lives in ffplayout in the office.** Cloudflare is just the fan-out layer.

### The Phase-2 alternative (when you get big): self-host

When your Cloudflare delivery bill crosses ~$2,500/mo (only at large scale), move the origin to a **Hetzner** server (~$50/mo) running **MediaMTX** (the modern replacement for the semi-abandoned nginx-rtmp), fronted by **Bunny CDN** (good African coverage, pay-per-GB). Put the origin **in a datacenter, never in the office** — offices have power cuts, CGNAT, and no static IP. This is cheaper per-viewer at scale but adds servers to babysit. Not for launch month.

### Is Cloudflare the cheapest? No — but it's the cheapest *zero-ops* option

We priced every realistic 2025–26 service against your shape (one 1080p stream in → HLS out, Africa-heavy). Three reference loads: **(a)** one 80-viewer × 2-hr event, **(b)** 100 viewers × 4 hr/day × 30 days, **(c)** 1,000 viewers × 4 hr/day × 30 days.

| Service | Built-in 24/7 scheduler? | (a) event | (b) /mo | (c) /mo | Africa edge |
|---|---|---|---|---|---|
| **Cloudflare Stream** | No (needs ffplayout) | $9.60 | **$720** | $7,200 | **Very good (Lagos PoP)** |
| **Mux** | No | ~$4 (free tier) | ~$845 | ~$7,325 | Good |
| **api.video** | No | $16 | $1,224 | $12,240 | OK |
| **AWS IVS** | No | ~$27 | ~$1,968 | ~$17,520 | Pricey region |
| **Bunny Stream (Volume net)** | No | $5 | **$150** | **$1,500** | Thin in Africa |
| **Bunny Stream (Africa net)** | No | $24 | $1,800 | $18,000 | Good |
| **Castr (turnkey)** | **YES** | $20 | $200 | ~$1,500+ (caps out) | Good (Akamai) |
| **Dacast (turnkey)** | **YES** | $39 plan | $63–165 plan | non-viable ($0.30/GB overage) | OK |
| **Self-host: Hetzner + Bunny Volume** | **YES (ffplayout, free)** | ~$52 | **~$200** | **~$1,550** | depends on CDN |
| **Gcore** | Enterprise only | quote | quote | quote | **Best Africa** |

**What this means for you:**
- **Cheapest zero-ops pick for launch (<100 concurrent): Cloudflare Stream.** Free ingest/encode, one flat rate ($0.06/viewer-hour), best African edge among the simple options, scenario (a) ≈ **$10**.
- **Want the scheduler built-in and no ffplayout at all?** **Castr** ($49.99/mo) has "TV Playout" — a real 24/7 linear channel with no extra software. Good MVP shortcut if you'd rather pay than run ffplayout. (It caps out at large scale.)
- **Mux** is basically free for a single small event (100,000 free delivery-min/month) but its always-on encoding meter makes it slightly pricier than Cloudflare for a 24/7 channel.
- **Cheapest at 1,000+ concurrent: self-host** ffplayout + MediaMTX on a Hetzner AX42 (€46/mo, **unlimited traffic**) → Bunny **Volume** CDN ($0.005/GB) ≈ **$1,550/mo vs $7,200** on Cloudflare (~5× cheaper). For Nigeria quality, front the same box with **Bunny-Africa or Gcore** and accept a middle cost — still beats AWS/Mux.
- **The crossover:** self-host's fixed ~$50/mo origin pays off above **~1,000 viewer-hours/month** (roughly a few hundred regular concurrent viewers). Below that, Cloudflare's no-server simplicity wins.
- **⚠️ Egress traps:** AWS IVS bills Africa above EU/US; Dacast's $0.30/GB overage is ruinous past its cap; "cheap Bunny" is only cheap on the **Volume** network ($0.005/GB) — Bunny's **Standard African** rate is $0.06/GB, same as Cloudflare, so test which Bunny network actually serves Lagos before committing.

**Bottom line: launch on Cloudflare Stream this month; plan the Hetzner+Bunny/Gcore self-host migration for when you cross ~1,000 sustained viewer-hours/month.** If you'd rather not touch ffplayout for v1, Castr's built-in playout is the easy-button alternative.

---

## 5. The full recommended architecture for EVO TV

```
┌──────────────────────── YOUR OFFICE ────────────────────────┐
│                                                              │
│   ffplayout  (the channel brain — scheduled files, 24/7) ──┐ │
│      ▲                                                      │ │
│      │ daily playlist (from /api/schedule)        RTMPS push│ │
│      │                                                      │ │
│   OBS  (live events ONLY — esports, hosted shows) ─────────┤ │
│      │                                                      │ │
│   ffplayout "task" webhook ──► tells backend what's airing  │ │
│                                                             │ │
└──────────────────────────────────────────────────────┼─────┘
                                                        │ (one ~6 Mbps stream)
                                                        ▼
                              ┌───────────────────────────────────┐
                              │   Cloudflare Stream Live Input     │
                              │   transcodes • records • delivers  │
                              └──────────────────┬────────────────┘
                                                 │ HLS (.m3u8)
                                                 ▼
                              ┌───────────────────────────────────┐
                              │  EVO TV app  (expo-video / hls.js) │
                              │  plays stream.hlsUrl               │
                              └───────────────────────────────────┘

EPG stays in sync:  /api/schedule  ──►  app's TV guide
                    /api/schedule  ──►  ffplayout playlist   (one source, can't drift)
```

**How the live/scheduled handoff works (the clean way):** you put live events **inside ffplayout's playlist** as a special item whose `source` is the URL OBS publishes to (a separate relay). At the scheduled time, ffplayout automatically switches from files to the live OBS feed, and switches back to files when the slot ends. Your "live" esports event therefore **airs on schedule, automatically**, and your EPG already knows about it. No manual cutover, no dead air.

---

## 6. Exact setup steps

### Step A — Office hardware & internet (buy / prepare)

| Component | Minimum | Comfortable | Why |
|---|---|---|---|
| **PC / CPU** | 6-core (Ryzen 5 / Core i5, recent) | 8-core (Ryzen 7 / Core i7) | Encoding one 1080p stream. `veryfast` preset is the standard. |
| **GPU (optional)** | — | NVIDIA RTX 20-series+ (NVENC) | NVENC offloads encoding off the CPU — **recommended** since the same box runs playout. |
| **RAM** | 16 GB | 32 GB | Playout + OBS + OS. |
| **Disk** | 256 GB SSD (OS) + library drive | NVMe + 1–2 TB | Your pre-recorded library. SSD so playback doesn't stutter. |
| **Upload speed** | **8 Mbps stable** | **15–20 Mbps** business fibre | Only ONE stream goes up. **Stability beats peak.** Wired Ethernet, never Wi-Fi. |
| **Power** | UPS that survives a flicker + generator | UPS + auto-start generator | A 5-second power blip kills the stream. Non-negotiable in Lagos. |

### Step B — Cloudflare Stream (15 minutes)

1. Create a Cloudflare account → **Stream** product → **Live Inputs** → **Create Live Input**, recording mode `automatic`.
2. Copy the **RTMPS server URL** and **stream key**.
3. Copy the **HLS playback URL**: `https://customer-<CODE>.cloudflarestream.com/<INPUT_UID>/manifest/video.m3u8` (append `?protocol=llhls` for ~3-second low latency).

### Step C — Install ffplayout (the channel brain)

1. On a Linux machine/VM in the office, install the ffplayout `.deb`/`.rpm` (v1.1.0). Web UI opens on `http://office-server:8787`.
2. In the channel's **output settings**, set "stream" mode pushing to Cloudflare:
   ```
   -c:v libx264 -preset veryfast -b:v 6000k -c:a aac -b:a 128k -ar 44100 \
   -flags +global_header -f flv rtmps://live.cloudflare.com:443/live/<CLOUDFLARE_STREAM_KEY>
   ```
   (Use NVENC: `-c:v h264_nvenc` if you have the GPU.)
3. Drop your video library onto the library drive; point ffplayout's media folder at it.
4. Set a filler clip (a station bumper / "be right back" loop) so gaps never go dark.
5. Start the channel. It's now broadcasting your schedule to Cloudflare → to the app.

### Step D — Wire the EPG into ffplayout (the adapter)

Write one small script (run daily by cron):
1. `GET https://api.evotv.co/api/schedule?date=<tomorrow>&pillar=all`
2. For each row, resolve it to a file path on the library drive (or, for a live event, the OBS relay URL), and build `{ source, in, out, duration }`.
3. `POST` the array to `http://office-server:8787/api/playlist/{channelId}/` with the ffplayout bearer token.

Now tomorrow's TV guide and tomorrow's actual air come from the **same** data.

### Step E — Point the app at the stream

In the admin (`/admin/streams`), set the stream's **`hlsUrl`** to the Cloudflare manifest URL from Step B.3. The app already plays `stream.hlsUrl` — no app code change needed.

### Step F — Make `isLive` honest (one small backend endpoint)

Add `/api/internal/now-airing` (service-token protected). Wire ffplayout's **task** script to call it on every program change so the backend flips `isLive` / current-program to match what's actually broadcasting. (Optionally also subscribe to Cloudflare's live-input "connected / disconnected" webhook as a backup signal.)

### Step G — OBS for live events

When you have a real live event:
- OBS → **Settings → Stream → Custom** → Server `rtmps://live.cloudflare.com:443/live/`, key = a **separate** relay key, and slot it into ffplayout's playlist as a live `source` (clean auto-handoff). Encoder settings: 1080p30, H.264, 6,000 kbps, keyframe interval 2s, audio AAC 128 kbps.

---

## 7. Dev work — status

| Task | Where | Status |
|---|---|---|
| `/api/internal/now-airing` endpoint (ffplayout → flip `isLive`/now-airing) | `../EVOTV/app/api/internal/now-airing/route.ts` | ✅ **Built** (typecheck clean) |
| `streams` now-airing columns + migration | `../EVOTV/db/schema/streaming.ts`, `db/migrations/0025_streams_now_airing.sql` | ✅ **Built** — needs `pnpm db:migrate` on prod |
| EPG → ffplayout playlist adapter (nightly job) | `../EVOTV/scripts/push-epg-to-ffplayout.mjs` (+ `media-map.example.json`) | ✅ **Built** (node --check clean) |
| ffplayout `task` hook → calls the endpoint | `../EVOTV/scripts/ffplayout-on-program-start.sh` | ✅ **Built** |
| Operator runbook (add file, schedule slot, go live) | `docs/OFFICE_OPERATOR_RUNBOOK.md` | ✅ **Built** |
| Admin: paste the Cloudflare `hlsUrl` onto a stream | `streams-manager-page.tsx` (HlsUrlEditor) + `app/api/admin/streams/[id]` PATCH + `lib/api/streams.ts` | ✅ **Built** (both typechecks clean) |
| **Media-library sync** — drop file on PC → appears in admin → pick + schedule from anywhere | migration 0026 (`playout_media` + `streams.playout_file_path`); `POST /api/internal/playout-media`; `GET /api/admin/playout-media`; `GET /api/internal/playout-resolve`; `scripts/report-media-library.mjs`; `lib/api/playout.ts`; `PlayoutFileEditor` in admin | ✅ **Built** (both typechecks clean) |
| (Optional) Cloudflare live-input status webhook as backup `isLive` | `../EVOTV/app/api/webhooks/cloudflare/` | ⬜ optional (~0.5 day) |

**All core plumbing is built and verified (app + backend typecheck EXIT=0).** Only remaining: apply migration 0025 on prod, and the optional Cloudflare backup webhook.

**Admin HLS field:** open **Admin → Streams**, tap a stream → the "Playback URL (HLS)" editor sits under the EPG schedule editor. Paste the Cloudflare `.m3u8` manifest, Save. "Clear" reverts to the auto origin path. Validates http(s) URL or `/path`; writes the streams `hlsPath` (audited as `stream.schedule_update`).

### Apply migration 0025

```bash
cd ../EVOTV && pnpm db:migrate
```
⚠️ The drizzle journal still has a known drift at **0022** (re-attempts, swallows a duplicate-constraint error). If `pnpm db:migrate` chokes on 0022 before reaching 0025, apply 0025 idempotently the same way you did 0023/0024 (the `db/apply-NN.ts` dotenv+tsx pattern), or run the five `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` lines from `0025_streams_now_airing.sql` directly on Neon. The SQL is idempotent.

### Env to set
- **Backend (`../EVOTV`):** `PLAYOUT_SECRET` — shared secret the ffplayout hook uses to call `/api/internal/now-airing`.
- **Office server:** `EVOTV_API_BASE`, `FFPLAYOUT_URL`, `FFPLAYOUT_USER`, `FFPLAYOUT_PASS`, `FFPLAYOUT_CHANNEL_ID`, `MEDIA_MAP`, `FILLER_SOURCE`, `FILLER_DURATION_SEC`, `DAY_START`, `PILLAR` (adapter) + `FFP_TOKEN`, `EVOTV_LINEAR_STREAM_ID`, `PLAYOUT_SECRET` (hook). See the file headers.

Everything else (player, EPG, reminders, admin scheduler) was already shipped.

---

## 8. COSTS — everything you'll pay

### One-time (office setup)

| Item | Cost (USD) | Notes |
|---|---|---|
| Streaming/playout PC (8-core + 16–32 GB + SSD) | **$800 – $1,500** | A decent desktop. Buy once. |
| NVIDIA GPU for NVENC (optional but recommended) | **$300 – $600** | Frees the CPU; can skip at launch. |
| Library storage (1–2 TB NVMe/SSD) | **$80 – $200** | Holds your pre-recorded catalogue. |
| UPS (battery backup) | **$150 – $500** | Sized to bridge to the generator. |
| Generator | **varies — likely already have one** | Lagos essential. |
| **One-time subtotal** | **~$1,300 – $2,800** | Plus generator if needed. |

### Recurring (monthly)

| Item | Cost | Notes |
|---|---|---|
| Business fibre, 15–20 Mbps stable upload | **~$50 – $200/mo** (Lagos business plans) | The ONE stream's path up. |
| **ffplayout** (playout software) | **FREE** | Open source. |
| **OBS** (live events) | **FREE** | Open source. |
| **Cloudflare Stream** delivery | **see unit economics below** | The main variable cost. |
| Apple Developer Program | **$99 / year** (~$8/mo) | Required for iOS. |
| Google Play Developer | **$25 one-time** | Not monthly. |
| Backend hosting (Vercel) + Neon DB | **already running** (~$0–20/mo Hobby/Pro) | No change. |

### Cloudflare Stream — how the delivery bill actually works

- **Pushing your stream up (ingest + encoding): FREE.**
- **Delivery: $1 per 1,000 viewer-minutes** = **$0.06 per viewer per hour.** Bandwidth included — no surprise egress bill.
- **Recording storage: $5 per 1,000 minutes stored.**

**Unit cost you can reason about:** every viewer-hour of 1080p ≈ **6 US cents.**

| Scenario | Math | Delivery cost |
|---|---|---|
| One 2-hour event, 80 viewers | 80 × 120 min × $0.001 | **~$9.60** |
| 100 concurrent, 4 hrs/day, 30 days | 100 × 240 × 30 = 720k min | **~$720/mo** |
| 100 concurrent, 8 hrs/day, 30 days | ~1.5M min | **~$1,512/mo** |
| 1,000 concurrent, 8 hrs/day, 30 days | ~14.5M min | **~$14,472/mo** |

> The big monthly numbers assume **continuous, all-day** streaming to a **packed** concurrent audience — worst case. Real early-launch usage (a few scheduled hours, dozens of viewers) lands in the **low tens of dollars per month.** You pay for minutes actually watched; an empty stream costs $0 to deliver.

### When Cloudflare gets expensive → switch to self-host (Phase 2)

At sustained large scale, self-hosting is ~5× cheaper:

| Path @ 1,000 concurrent, 1080p, heavy use | Monthly |
|---|---|
| Cloudflare Stream | ~$14,472 |
| **Hetzner ($50) + Bunny CDN egress** | **~$2,750** |

**Trigger:** migrate when the Cloudflare bill crosses ~$2,500/mo. Until then, Cloudflare's simplicity is worth it.

---

## 9. App store registration (Google Play + Apple)

> **The single thing that decides if June is realistic:** the **D-U-N-S number** (a free company ID needed for *organization* accounts on BOTH stores) + **Apple's manual org verification**. For a foreign (Nigerian) company these can take **2–4+ weeks**. Decide your account type before doing anything else. The fast path is at the end.

### 9.1 Google Play

**Account type — Personal vs Organization.** Same functionality; different proof and one huge difference:

| | Personal | Organization |
|---|---|---|
| Proof Google needs | Government photo ID + phone | **D-U-N-S number** + legal org name + address + **verified official website** + phone |
| **12-tester / 14-day closed-test rule** | **YES — applies** | **NO — exempt** |
| Speed to launch | Fast to set up, but +14 days of forced testing | Slower setup, but no test gate |

- **Fee:** **$25 one-time, non-refundable.** 🇳🇬 **A normal Nigerian card will be declined** — pay with a **virtual USD card** (Chipper / Grey / Geegpay funded in dollars). This trips up almost every Nigerian first-timer.
- **Identity verification** (required before you can publish): personal = photo ID + phone; org = legal name + address + D-U-N-S + website. Review takes **a few days**.
- **🔴 The 12-tester / 14-day closed test (PERSONAL accounts only):** before you can request *production*, you must run a closed test with **≥12 testers opted in continuously for 14 days**. If testers drop below 12, the clock **resets**. **Organization accounts skip this entirely.** This is the rule that blows June deadlines.
- **Listing & submit:** upload an **AAB** (not APK), fill store listing (icon 512×512, **feature graphic 1024×500**, 2–8 screenshots, +TV screenshots since you target Android TV), content rating, **Data Safety form** (needs a privacy policy URL), give Google a **test login** (or it's rejected as un-reviewable). Review **1–3 days** (up to ~7 for new accounts).
- **🇳🇬 Nigeria:** yes, Nigerians can register + get paid (wire payout to local bank). Paid apps/IAP need a merchant profile (bank + tax info). Confirm your bank accepts USD inflows; payout name must match verified identity.

### 9.2 Apple App Store

- **Fee:** **$99/year** (same for Individual and Organization). Recurring.
- **Individual enrollment:** Apple Account + 2FA, **no D-U-N-S, no manual review — done same day.**
- **🔴 Organization enrollment:** needs a **D-U-N-S number** (free from Dun & Bradstreet — check [Apple's lookup tool](https://developer.apple.com/enroll/duns-lookup/) first, you may already have one) **+ a manual Apple verification** (often a phone call). Apple says "up to 5 business days," but **foreign companies routinely wait 2–4+ weeks, sometimes 6–12.** **This is the #1 reason a June launch slips.**
- **✅ No Mac needed.** You're on Expo — **EAS Build** compiles iOS on Expo's cloud Macs, **EAS Submit** uploads to App Store Connect from Windows. Use an **App Store Connect API key** (`.p8` + Key ID + Issuer ID in `eas.json`). `eas build -p ios --profile production` → `eas submit -p ios`.
- **App Store Connect:** register bundle ID (`com.evotv.app`), create app record, assets (icon 1024×1024 **no alpha**; **6.9" iPhone screenshots mandatory in 2025**, +13" iPad if iPad-supported), App Privacy nutrition labels, age rating.
- **🛑 Sign in with Apple is REQUIRED** — because you offer Google Sign-In, Guideline **4.8** forces an equivalent Apple sign-in option, or instant rejection. Build it **before** submitting.
- **Review:** ~90% within **24 hours**; complex apps 2–7 days. **Streaming-app rejection traps:**
  - **3.1.1 (IAP):** unlocking digital content/subscriptions *in-app* **must** use Apple IAP (**30%** cut, 15% under $1M/yr) — no external checkout. **A genuinely FREE app has nothing for Apple to take a cut of → sidesteps this entirely.**
  - **4.8:** missing Sign in with Apple.
  - **2.1:** login wall with no demo account → give reviewer test credentials.
  - **Content rights:** Apple may demand proof you have rights to streamed sports/anime — have licensing docs ready.
- **🇳🇬 Nigeria:** enrollment works from Nigeria. Charging anything needs the **Paid Applications Agreement** + a **W-8BEN** (individual) / **W-8BEN-E** (company) to avoid 30% US tax withholding, + bank account. A **free app skips all of this.** Payout via EFT ~45 days after month-end, ~$40 threshold.

### 9.3 Recommendation — fastest realistic June launch

1. **Google Play → Organization IF you have a D-U-N-S in hand (or within ~1 week)** — it skips the 14-day test gate (saves ~2 weeks). No D-U-N-S? Go **Personal but start the 12-tester closed test on Day 1** (runs in parallel; the 14 days can't be shortcut).
2. **Apple → Individual for June.** Instant, no D-U-N-S, no manual verification. **Migrate to an Organization account later** once the D-U-N-S/verification clears — you lose nothing.
3. **Launch the MVP FREE (no in-app digital purchases).** Sidesteps Apple's 30% IAP rule AND all the Paid-Apps-Agreement / W-8BEN / banking setup. Add paid subs in a fast-follow.
4. **No Mac** — EAS Build → EAS Submit from Windows.
5. **Start TODAY, parallelize:** Day 0 — get/confirm **D-U-N-S** (free, long pole; do it even for an Individual Apple launch so org migration is unblocked later), pay Google $25 (virtual USD card) + Apple $99, and if Google = Personal **kick off the 12-tester test immediately**. Day 0–2 — build **Sign in with Apple**, prep privacy policy URL + screenshots + copy. Day 2–5 — EAS build + submit both, fill all the forms, give reviewer logins. Day 5–14 — reviews land.

**Verdict:** **Apple = very achievable** (Individual + free app). **Google = achievable as Org** (if D-U-N-S in hand); as **Personal**, only if the 14-day test starts in the first days of the month.

### 9.4 Cost + lead-time table (stores)

| Item | Cost | Time | Flag |
|---|---|---|---|
| Google Play account | $25 once (virtual USD card) | Same day | 🇳🇬 card |
| Google identity verification | $0 | A few days | — |
| Google D-U-N-S (org) | $0 | 5–14 business days | 🟠 org |
| Google 12-tester/14-day test (personal) | $0 | **14+ days** | 🔴 personal blocker |
| Google listing + review | $0 | assets ~1d; review 1–7d | — |
| Apple Developer Program | $99/yr | Individual same day; **org days–weeks** | 🔴 org |
| Apple D-U-N-S (org) | $0 | **2–4 wks, up to 6–12 for foreign cos** | 🔴 slowest item |
| Apple org verification (manual) | $0 | ~1–4+ wks | 🔴 |
| Mac | **$0 — not needed (EAS)** | — | ✅ |
| Sign in with Apple build | dev time | ~1–3 days | must ship pre-review |
| Apple assets + review | $0 | assets ~1d; review <24h–7d | — |

### 9.5 How to get a D-U-N-S number (the long pole — start today)

A D-U-N-S number is a **free 9-digit business ID** from Dun & Bradstreet. Apple + Google use it to confirm your company is a real registered entity. It's the slowest single step, so start it **first**.

**Prerequisite — a registered company.** In Nigeria that's a **CAC registration**. ⚠️ Register a **Limited company (RC number)**, not just a Business Name — Apple treats a plain Business Name as a "trade name / DBA" and **rejects it**. Have ready: exact legal name (as on the CAC cert), a verifiable street address, a **working company phone** (D&B calls it to verify), and a business email. Scan your **CAC Certificate, CO2, CO7, and a proof-of-address** (utility bill).

**Step 1 — check if you already have one (free, instant).** Many companies do without knowing. Use **Apple's lookup tool**: https://developer.apple.com/enroll/duns-lookup/ — enter legal name + Nigeria + address. If found, you're done. If not, it lets you request one free.

**Step 2 — request it free.** Either through that Apple tool, or directly at https://www.dnb.com/en-us/smb/duns/get-a-duns.html ("Claim Your Free D-U-N-S"). **Do NOT click the paid expedited upsell** (~$229) unless you're against a hard deadline — Apple/Google accept the free one. For Nigeria, the D&B partner is reachable at **`info_Nigeria@dnbsame.com`** if the tool can't find/verify you.

**Step 3 — answer the verification.** D&B calls your company phone and may email for documents. **Answer the call**, reply fast — silence stalls it. The name/address you give must match the CAC certificate **character-for-character**.

**Step 4 — feed it to the stores.** Apple org enrollment (and Google org setup) independently re-verify the D-U-N-S; the legal name + address you type must **exactly match** D&B. Apple refreshes its D&B mirror ~every 2 weeks, so a brand-new number may not appear immediately — wait a few days and retry if "not found."

**Realistic timeline (Nigeria):**

| | Free route | Paid fast-track |
|---|---|---|
| Get the number | **3–9 weeks** | 5–8 business days (~$229 D&B, or ~₦70k local agent) |
| Apple/Google verification after | +1–2 weeks | +1–2 weeks |
| **Ready to publish** | **~5–11 weeks** | **~2–4 weeks** |

**For a late-June launch:** the free route realistically lands **mid-to-late July**. To hit June with a **company** account you'd need the **paid fast-track** — the one case where paying is justified. The faster alternative (in §9.3): launch with an **Apple Individual** account (no D-U-N-S, instant) now, migrate to the company account once the free D-U-N-S clears. **Either way: run the Apple lookup tool and submit the free request TODAY.**

---

## 10. June launch — go/no-go punch-list

**Streaming pipeline (this doc):**
- [ ] Office PC + UPS + 15 Mbps stable upload ready
- [ ] Cloudflare Stream Live Input created, RTMPS key + HLS URL captured
- [ ] ffplayout installed, library loaded, filler set, pushing to Cloudflare
- [ ] EPG → ffplayout adapter cron running
- [ ] `/api/internal/now-airing` + task webhook wired (`isLive` honest)
- [ ] Stream `hlsUrl` set to Cloudflare manifest; verified playing in app
- [ ] OBS tested for a live event with clean handoff
- [ ] Operator runbook written

**App / store (separate track):**
- [ ] iOS: Apple Developer paid + Sign in with Apple + first build
- [ ] Android: production AAB build profile, Data Safety form, content rating
- [ ] Store listing assets (icon, screenshots, copy)
- [ ] Content seeded (live + VOD + scheduled lineup populated)

**Realistic timeline:** streaming pipeline is **~1 week** of setup + ~3 dev days. The **long pole is Apple org verification (D-U-N-S number can take 1–2+ weeks)** — start that TODAY if you want iOS in June. Android can go faster. **A late-June Android-first launch with iOS following is the realistic shape.**
