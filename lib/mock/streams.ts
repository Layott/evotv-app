import type { Stream } from "@/lib/types";
import { sleep, byId, hoursAgo } from "./_util";
import { streamThumb } from "./_media";

export const streams: Stream[] = [
  {
    id: "channel_main",
    title: "EVO TV Channel — 24/7 Esports",
    description:
      "The EVO TV flagship channel. Non-stop rotation of highlights, recaps, weekly shows, and simulcasts of headline African esports events.",
    eventId: null,
    gameId: "game_freefire",
    streamerType: "official",
    streamerName: "EVO TV Channel",
    streamerAvatarUrl: "/evo-logo/evo-tv-152.png",
    isLive: true,
    startedAt: hoursAgo(72),
    endedAt: null,
    hlsUrl: "/demo/sample.m3u8",
    thumbnailUrl: "/evo-logo/evo-tv-hero.png",
    viewerCount: 24_300,
    peakViewerCount: 38_900,
    language: "en",
    tags: ["EVO TV", "24/7", "Flagship", "Africa", "Esports"],
    isPremium: false,
  },
  {
    id: "stream_lagos_final",
    title: "EVO Lagos Invitational — Semifinal 1 LIVE",
    description: "Team Alpha vs Nova Esports. Best of 5. English commentary.",
    eventId: "event_ff_lagos",
    gameId: "game_freefire",
    streamerType: "official",
    streamerName: "EVO TV Official",
    streamerAvatarUrl: "/evo-logo/evo-tv-152.png",
    isLive: true,
    startedAt: hoursAgo(1),
    endedAt: null,
    hlsUrl: "/demo/sample.m3u8",
    thumbnailUrl: streamThumb("stream_lagos_final"),
    viewerCount: 18_420,
    peakViewerCount: 21_300,
    language: "en",
    tags: ["Free Fire", "EVO", "Lagos", "Semifinal"],
    isPremium: false,
  },
  {
    id: "stream_casablanca",
    title: "PUBG Mobile Casablanca Classic — Final Day",
    description: "Zenith vs Hydra. Arabic + English dual audio.",
    eventId: "event_pubgm_casablanca",
    gameId: "game_pubgm",
    streamerType: "official",
    streamerName: "EVO TV Official",
    streamerAvatarUrl: "/evo-logo/evo-tv-152.png",
    isLive: true,
    startedAt: hoursAgo(2),
    endedAt: null,
    hlsUrl: "/demo/sample.m3u8",
    thumbnailUrl: streamThumb("stream_casablanca"),
    viewerCount: 7_280,
    peakViewerCount: 9_140,
    language: "ar",
    tags: ["PUBG Mobile", "Casablanca", "Final"],
    isPremium: false,
  },
  {
    id: "stream_codm_scrim",
    title: "CoD Mobile Scrim Night — Titan vs Rogue",
    description: "Pre-Cairo Cup preparation scrims.",
    eventId: null,
    gameId: "game_codm",
    streamerType: "official",
    streamerName: "EVO TV Official",
    streamerAvatarUrl: "/evo-logo/evo-tv-152.png",
    isLive: true,
    startedAt: hoursAgo(1),
    endedAt: null,
    hlsUrl: "/demo/sample.m3u8",
    thumbnailUrl: streamThumb("stream_codm_scrim"),
    viewerCount: 2_140,
    peakViewerCount: 3_020,
    language: "en",
    tags: ["CoD Mobile", "Scrim"],
    isPremium: false,
  },
  {
    id: "stream_premium_analysis",
    title: "Post-match Film Room — Week 4 (PREMIUM)",
    description: "Deep-dive film analysis from former pros. Premium subscribers only.",
    eventId: null,
    gameId: "game_freefire",
    streamerType: "official",
    streamerName: "Film Room",
    streamerAvatarUrl: "/interview-panel.png",
    isLive: true,
    startedAt: hoursAgo(1),
    endedAt: null,
    hlsUrl: "/demo/sample.m3u8",
    thumbnailUrl: streamThumb("stream_premium_analysis"),
    viewerCount: 640,
    peakViewerCount: 920,
    language: "en",
    tags: ["Analysis", "Free Fire", "Premium"],
    isPremium: true,
  },
  {
    id: "stream_talk_show",
    title: "The Evo Talk — Episode 12",
    description: "Weekly roundtable. Guest: Team Alpha IGL.",
    eventId: null,
    gameId: "game_freefire",
    streamerType: "official",
    streamerName: "Evo Talk",
    streamerAvatarUrl: "/interview-panel.png",
    isLive: true,
    startedAt: hoursAgo(1),
    endedAt: null,
    hlsUrl: "/demo/sample.m3u8",
    thumbnailUrl: streamThumb("stream_talk_show"),
    viewerCount: 1_310,
    peakViewerCount: 1_800,
    language: "en",
    tags: ["Talk Show", "Weekly"],
    isPremium: false,
  },
  {
    id: "stream_eafc_watch",
    title: "EA FC Continental — Watch Party",
    description: "Community watch-along with live commentary.",
    eventId: "event_eafc_fc_cup",
    gameId: "game_eafc",
    streamerType: "official",
    streamerName: "EVO TV Football",
    streamerAvatarUrl: "/evo-logo/evo-tv-152.png",
    isLive: true,
    startedAt: hoursAgo(1),
    endedAt: null,
    hlsUrl: "/demo/sample.m3u8",
    thumbnailUrl: streamThumb("stream_eafc_watch"),
    viewerCount: 480,
    peakViewerCount: 720,
    language: "en",
    tags: ["EA FC", "Watch Party"],
    isPremium: false,
  },
  // ── Anime pillar — UGC reaction streams + cosplay + otaku podcasts ────
  {
    id: "stream_anime_addict_naija",
    title: "AnimeAddict Naija — Demon Slayer S4 Premiere Reaction",
    description:
      "First-watch reaction to the new Demon Slayer season premiere. Live chat + spoiler-free zone for the first 24 hours.",
    eventId: null,
    gameId: "game_freefire",
    streamerType: "creator",
    streamerName: "AnimeAddict Naija",
    streamerAvatarUrl: "/evo-logo/evo-tv-152.png",
    isLive: true,
    startedAt: hoursAgo(0.5),
    endedAt: null,
    hlsUrl: "/demo/sample.m3u8",
    thumbnailUrl: streamThumb("stream_anime_addict_naija"),
    viewerCount: 6_840,
    peakViewerCount: 8_100,
    language: "en",
    tags: ["Anime", "Reaction", "Demon Slayer", "Premiere"],
    isPremium: false,
    pillar: "anime",
  },
  {
    id: "stream_otaku_talk",
    title: "Otaku Talk Lagos — Weekly Top 10 Anime Hot Takes",
    description:
      "Three otakus, ten anime takes, infinite debate. Drop your picks in chat.",
    eventId: null,
    gameId: "game_freefire",
    streamerType: "creator",
    streamerName: "Otaku Talk",
    streamerAvatarUrl: "/evo-logo/evo-tv-152.png",
    isLive: true,
    startedAt: hoursAgo(1.5),
    endedAt: null,
    hlsUrl: "/demo/sample.m3u8",
    thumbnailUrl: streamThumb("stream_otaku_talk"),
    viewerCount: 2_310,
    peakViewerCount: 3_080,
    language: "en",
    tags: ["Anime", "Podcast", "Debate"],
    isPremium: false,
    pillar: "anime",
  },
  {
    id: "stream_cosplay_sunday",
    title: "Cosplay Sunday — Build-along: Sukuna armor finale",
    description:
      "Foam-armor finishing session. Q&A throughout. Suitable for beginners.",
    eventId: null,
    gameId: "game_freefire",
    streamerType: "creator",
    streamerName: "Cosplay Sunday",
    streamerAvatarUrl: "/evo-logo/evo-tv-152.png",
    isLive: true,
    startedAt: hoursAgo(0.25),
    endedAt: null,
    hlsUrl: "/demo/sample.m3u8",
    thumbnailUrl: streamThumb("stream_cosplay_sunday"),
    viewerCount: 1_240,
    peakViewerCount: 1_540,
    language: "en",
    tags: ["Anime", "Cosplay", "Craft"],
    isPremium: false,
    pillar: "anime",
  },
  // ── Lifestyle pillar — podcasts + talk shows + news ───────────────────
  {
    id: "stream_lagos_lifestyle_pod",
    title: "Lagos Lifestyle Pod — Live: Inside the new Eko nightlife",
    description:
      "Three hosts, one new bar a week. Tonight: rooftop scenes in Lekki. Listener calls open.",
    eventId: null,
    gameId: "game_freefire",
    streamerType: "creator",
    streamerName: "Lagos Lifestyle Pod",
    streamerAvatarUrl: "/evo-logo/evo-tv-152.png",
    isLive: true,
    startedAt: hoursAgo(0.75),
    endedAt: null,
    hlsUrl: "/demo/sample.m3u8",
    thumbnailUrl: streamThumb("stream_lagos_lifestyle_pod"),
    viewerCount: 4_120,
    peakViewerCount: 5_300,
    language: "en",
    tags: ["Lifestyle", "Podcast", "Nightlife", "Lagos"],
    isPremium: false,
    pillar: "lifestyle",
  },
  {
    id: "stream_tech_talk_africa",
    title: "Tech Talk Africa — Live: AI startups breaking out of Nairobi",
    description:
      "Founder interviews + breaking tech news. Live Q&A in chat throughout.",
    eventId: null,
    gameId: "game_freefire",
    streamerType: "creator",
    streamerName: "Tech Talk Africa",
    streamerAvatarUrl: "/evo-logo/evo-tv-152.png",
    isLive: true,
    startedAt: hoursAgo(2),
    endedAt: null,
    hlsUrl: "/demo/sample.m3u8",
    thumbnailUrl: streamThumb("stream_tech_talk_africa"),
    viewerCount: 3_540,
    peakViewerCount: 4_220,
    language: "en",
    tags: ["Lifestyle", "Tech", "News", "Africa"],
    isPremium: false,
    pillar: "lifestyle",
  },
  {
    id: "stream_nollywood_news_daily",
    title: "Nollywood News Daily — Tonight's industry roundup",
    description:
      "What dropped, who signed, who's beefing. The 30-minute daily Nollywood digest.",
    eventId: null,
    gameId: "game_freefire",
    streamerType: "creator",
    streamerName: "Nollywood News Daily",
    streamerAvatarUrl: "/evo-logo/evo-tv-152.png",
    isLive: true,
    startedAt: hoursAgo(0.1),
    endedAt: null,
    hlsUrl: "/demo/sample.m3u8",
    thumbnailUrl: streamThumb("stream_nollywood_news_daily"),
    viewerCount: 5_870,
    peakViewerCount: 6_900,
    language: "en",
    tags: ["Lifestyle", "News", "Nollywood"],
    isPremium: false,
    pillar: "lifestyle",
  },
];

// Default pillar fallback for legacy seed rows without an explicit `pillar`.
// Phase 9a treats anything pre-existing as esports — accurate for all
// existing seed rows above the divider.
for (const s of streams) {
  if (!s.pillar) s.pillar = "esports";
}

export async function listLiveStreams(filter?: {
  gameId?: string;
  isPremium?: boolean;
}): Promise<Stream[]> {
  await sleep();
  let result = streams.filter((s) => s.isLive);
  if (filter?.gameId) result = result.filter((s) => s.gameId === filter.gameId);
  if (typeof filter?.isPremium === "boolean")
    result = result.filter((s) => s.isPremium === filter.isPremium);
  return result.sort((a, b) => b.viewerCount - a.viewerCount);
}

export async function getStreamById(id: string): Promise<Stream | null> {
  await sleep();
  return byId(streams, id);
}

export async function listFeaturedStreams(): Promise<Stream[]> {
  await sleep();
  const channel = streams.find((s) => s.id === "channel_main");
  const others = streams.filter((s) => s.isLive && s.id !== "channel_main").slice(0, 2);
  return channel ? [channel, ...others] : others;
}

export async function getMainChannel(): Promise<Stream | null> {
  await sleep(40);
  return streams.find((s) => s.id === "channel_main") ?? null;
}

// In-memory report log (mock only — Phase 2 swaps for ops.audit_log writes).
const reportLog: Array<{ streamId: string; reason: string; reportedBy: string; at: string }> = [];

export async function reportStream(streamId: string, reason = "user-reported", reportedBy = "user_current"): Promise<{ ticketId: string }> {
  await sleep(120);
  const at = new Date().toISOString();
  reportLog.push({ streamId, reason, reportedBy, at });
  return { ticketId: `RPT-${streamId}-${Date.now().toString(36)}` };
}

export function getReportLog() {
  return reportLog.slice();
}
