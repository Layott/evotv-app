# EVO TV — Office Operator Runbook

> For the person/team running the channel from the office every day. No engineering background needed.
> Pairs with `docs/STREAMING_PLAYOUT_SETUP.md` (the one-time setup). This doc is **daily operations**.

---

## The mental model (read once)

You run a **TV channel**. Two programs do the work:

- **ffplayout** = the autopilot. It plays your pre-recorded files on a schedule, 24/7, by itself. Web page at `http://<office-server>:8787`.
- **OBS** = the manual camera/live tool. Only used when something is happening **live** (an esports match, a host on camera).

Both send video to **Cloudflare** (or your chosen delivery service), which sends it to viewers' phones. The app shows a **TV guide** that comes from the **admin schedule** — and the same schedule tells ffplayout what to play. Keep the schedule right and everything lines up.

**One golden habit:** whatever you want people to see in the app's guide, you set it in **Admin → Streams / Schedule**. The autopilot reads from there. Don't schedule things only in ffplayout — always go through the admin so the guide matches.

---

## Daily checklist (5 minutes)

1. **Is the channel on air?** Open the EVO TV app or `evotv.co` → the live channel should be playing.
2. **Is the autopilot running?** Open `http://<office-server>:8787` → the channel shows a green/active state and a current clip.
3. **Is tomorrow scheduled?** The nightly job builds tomorrow's playlist automatically (see "How the schedule flows"). Spot-check that tomorrow has programs in the admin.
4. **Power/UPS OK?** Glance at the UPS — on battery? Find out why. A power cut drops the stream.
5. **Internet upload OK?** The office only needs ~6–8 Mbps **stable** upload. If the stream is buffering for viewers, check the office upload speed first.

---

## How the schedule flows (so you know what to trust)

```
You set airtimes in  Admin → Streams (ScheduleEditor)  +  episode premiere times
                                   │
                                   ▼
                    /api/schedule  (the single source of truth)
                       │                         │
                       ▼                         ▼
              App TV guide              Nightly job builds ffplayout's
              (what viewers see)        playlist for the next day
                                                 │
                                                 ▼
                                    ffplayout plays the right file
                                    at the right minute, all day
```

You only ever edit the schedule in **one place (the admin)**. The guide and the autopilot both follow it.

---

## Task: add a new video to the library

1. Copy the finished video file (`.mp4`, H.264) onto the office server's **library drive** — into the right folder (e.g. `/media/anime/<show>/`).
2. Open `scripts/media-map.json` on the office server and add a line linking the program to its file. Example:
   ```json
   "ep_onepiece_s1e3": "/media/anime/one-piece/S01E03.mp4"
   ```
   The left side is the program's **EpgRow id** (from the schedule). If you're unsure of the id, you can also map by the program's watch URL (e.g. `"/show/one-piece/1/3": "/media/.../S01E03.mp4"`).
3. That's it — next time the nightly job runs, that program will air from this file. (To test now, run the job manually — see below.)

> If a program has **no** entry in `media-map.json`, the autopilot plays **filler** in its slot instead of airing the wrong file. So a missing map = a safe gap, not a crash.

---

## Task: schedule a program at a specific time

1. Go to **Admin → Streams** (in the app/admin).
2. For a live-stream slot: open the stream, use the **Schedule editor**, set **start time** (your local time) and **duration (minutes)**, Save.
3. For an anime/lifestyle episode: set its **premiere time** in **Admin → Content**.
4. The app guide updates immediately. The autopilot picks it up on the **next nightly build** (or run the job now to apply today).

**Make sure the file is mapped** (previous task) so the autopilot has something to play at that time.

---

## Task: run a live event with OBS (esports, host on camera)

You have two ways. **Scheduled handoff (preferred)** keeps the autopilot in charge:

1. In **Admin**, schedule the live event in the normal way (it shows in the guide).
2. In `media-map.json`, map that event's id to the **live relay URL** instead of a file, e.g.:
   ```json
   "match_grandfinal_2026": "rtmp://127.0.0.1/relay/esports-live"
   ```
3. Set up OBS to publish to that **relay** (Settings → Stream → Custom → the relay URL + key).
4. At the scheduled time, the autopilot automatically switches from files to your OBS feed, and switches back to files when the slot ends. **Start OBS a few minutes early.**

**Manual cutover (only if you can't pre-schedule):**
1. Stop the autopilot's output (ffplayout web UI → stop the channel) **or** plan to override.
2. Point OBS directly at the channel's delivery target (the Cloudflare RTMPS URL + key) and **Start Streaming**.
3. When done, stop OBS and start the autopilot again. (Expect a few seconds of disruption at each switch. Only one thing should publish to a given key at a time.)

**OBS encoder settings (one 1080p stream):** 1080p30 · H.264 · 6,000 kbps · keyframe interval 2s · audio AAC 128 kbps · `veryfast` (or NVENC if you have the GPU).

---

## Task: run tomorrow's schedule manually (don't wait for the nightly job)

On the office server, in the project folder:
```bash
node scripts/push-epg-to-ffplayout.mjs            # builds TOMORROW
node scripts/push-epg-to-ffplayout.mjs 2026-06-15 # builds a specific day
DRY_RUN=1 node scripts/push-epg-to-ffplayout.mjs  # preview without uploading
```
It prints a summary like: `EPG 2026-06-15: 8 rows → 6 aired, 2 skipped, ... ends 21.50h`. **"skipped"** means those programs had no file mapped — fix `media-map.json` and re-run.

---

## Troubleshooting

| Symptom | First thing to check |
|---|---|
| **App shows the channel offline** | Is ffplayout running (`:8787`)? Is OBS or ffplayout actually pushing to Cloudflare? Check the Cloudflare Stream dashboard "Live Input" — does it say "connected"? |
| **Guide says a show is on, but a different/filler video is playing** | The program isn't mapped in `media-map.json`, so filler is covering it. Add the file mapping, re-run the job. |
| **Viewers buffering / low quality** | Check office **upload** speed (need ~6–8 Mbps stable, wired). Check Cloudflare dashboard for the input health. |
| **A show aired at the wrong time** | Times are set in the admin. Check the schedule there. Also confirm the office server clock + ffplayout timezone are correct. |
| **"Now airing" in the app is stuck on an old program** | The `ffplayout-on-program-start.sh` hook may have failed. Check it can reach the backend and that `PLAYOUT_SECRET` matches. |
| **Stream dropped during a live event** | Power (UPS/generator)? Internet blip? Restart OBS / the autopilot. For lossy links, prefer SRT over RTMP. |

---

## Who to call vs what you can fix yourself

**You can fix:** scheduling, mapping files, starting/stopping OBS, restarting the autopilot, checking power/internet.

**Call the engineer for:** the Cloudflare account/keys, the `media-map.json` structure changing, the `/api/internal/now-airing` connection, backend/admin errors, or anything involving stream keys and secrets.

---

## The pieces, named (reference)

- **ffplayout** — playout autopilot, web UI `:8787`, on the office server.
- **OBS** — live encoder, on the office server (or an operator PC).
- **`scripts/push-epg-to-ffplayout.mjs`** — nightly job: schedule → autopilot playlist.
- **`scripts/media-map.json`** — which program plays which file/live URL.
- **`scripts/ffplayout-on-program-start.sh`** — tells the app what's airing now.
- **Cloudflare Stream** — receives the one stream, delivers to all phones.
- **Admin → Streams / Content** — where you set what's in the guide.
