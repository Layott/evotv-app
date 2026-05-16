import type {
  ContentPillar,
  Episode,
  EpisodeProgress,
  Season,
  Show,
  ShowOriginType,
  ShowStatus,
  ShowWatchlist,
  WatchlistStatus,
} from "@/lib/types";
import { sleep, daysAgo } from "./_util";
import { streamThumb } from "./_media";
import { syncGet, syncSet } from "@/lib/storage/persist";

/**
 * Phase 9b — EVO Originals + Licensed shows.
 *
 * Show → Season → Episode hierarchy. Three pillars represented. Five shows
 * total — enough to scaffold every surface (Originals hub rail, show landing,
 * episode list, episode player, continue-watching) without feeling empty.
 */

export const shows: Show[] = [
  {
    id: "show_naija_esports_inside",
    slug: "inside-naija-esports",
    title: "Inside Naija Esports",
    synopsis:
      "Behind-the-scenes with West Africa's top-ranked esports teams. Practice rituals, road trips, locker-room mics, and the tournaments that made the careers.",
    heroUrl: streamThumb("show_naija_esports_inside_hero"),
    posterUrl: streamThumb("show_naija_esports_inside_poster"),
    pillar: "esports",
    originType: "evo_original",
    status: "airing",
    primaryCreatorHandle: "evotv-originals",
    totalSeasons: 2,
    totalEpisodes: 8,
    rating: 8.6,
    releasedAt: daysAgo(120),
    tags: ["Docuseries", "Africa", "Esports"],
  },
  {
    id: "show_otaku_court",
    slug: "otaku-court",
    title: "Otaku Court",
    synopsis:
      "Weekly anime debate show. Three otakus, one verdict. New episodes Friday — every season closes with a community-voted finale.",
    heroUrl: streamThumb("show_otaku_court_hero"),
    posterUrl: streamThumb("show_otaku_court_poster"),
    pillar: "anime",
    originType: "evo_original",
    status: "airing",
    primaryCreatorHandle: "otaku-talk",
    totalSeasons: 2,
    totalEpisodes: 12,
    rating: 9.1,
    releasedAt: daysAgo(90),
    tags: ["Anime", "Debate", "Weekly"],
  },
  {
    id: "show_sukuna_armor_diaries",
    slug: "sukuna-armor-diaries",
    title: "Sukuna Armor Diaries",
    synopsis:
      "Six-episode build-along: foam, EVA, paint, weathering. By the season finale you have your own Sukuna armor for the next con.",
    heroUrl: streamThumb("show_sukuna_armor_diaries_hero"),
    posterUrl: streamThumb("show_sukuna_armor_diaries_poster"),
    pillar: "anime",
    originType: "licensed",
    status: "completed",
    primaryCreatorHandle: "cosplay-sunday",
    totalSeasons: 1,
    totalEpisodes: 6,
    rating: 8.4,
    releasedAt: daysAgo(45),
    tags: ["Anime", "Cosplay", "Build-along"],
  },
  {
    id: "show_lagos_after_dark",
    slug: "lagos-after-dark",
    title: "Lagos After Dark",
    synopsis:
      "What happens when the city sleeps. Nightshift workers, after-hours kitchens, dawn-rave promoters. Eight-part lifestyle audio-doc series.",
    heroUrl: streamThumb("show_lagos_after_dark_hero"),
    posterUrl: streamThumb("show_lagos_after_dark_poster"),
    pillar: "lifestyle",
    originType: "evo_original",
    status: "airing",
    primaryCreatorHandle: "lagos-lifestyle-pod",
    totalSeasons: 1,
    totalEpisodes: 8,
    rating: 8.9,
    releasedAt: daysAgo(30),
    tags: ["Lifestyle", "Podcast", "Lagos", "Audio-doc"],
  },
  {
    id: "show_continent_tech",
    slug: "continent-tech",
    title: "Continent Tech",
    synopsis:
      "Weekly long-form interviews with African founders building global products. From Nairobi AI labs to Cape Town fintech — the conversations behind the cap tables.",
    heroUrl: streamThumb("show_continent_tech_hero"),
    posterUrl: streamThumb("show_continent_tech_poster"),
    pillar: "lifestyle",
    originType: "evo_original",
    status: "airing",
    primaryCreatorHandle: "tech-talk-africa",
    totalSeasons: 3,
    totalEpisodes: 24,
    rating: 9.3,
    releasedAt: daysAgo(200),
    tags: ["Lifestyle", "Tech", "Interview", "Long-form"],
  },
];

export const seasons: Season[] = [
  // Inside Naija Esports — S1 (4 eps) + S2 (4 eps)
  { id: "season_naija_s1", showId: "show_naija_esports_inside", seasonNumber: 1, title: "Free Fire reign", episodeCount: 4, releasedAt: daysAgo(120) },
  { id: "season_naija_s2", showId: "show_naija_esports_inside", seasonNumber: 2, title: "Cross-game expansion", episodeCount: 4, releasedAt: daysAgo(30) },
  // Otaku Court — S1 (6) + S2 (6)
  { id: "season_otaku_s1", showId: "show_otaku_court", seasonNumber: 1, title: "Founding rulings", episodeCount: 6, releasedAt: daysAgo(90) },
  { id: "season_otaku_s2", showId: "show_otaku_court", seasonNumber: 2, title: "The community-trial era", episodeCount: 6, releasedAt: daysAgo(20) },
  // Sukuna — S1 (6)
  { id: "season_sukuna_s1", showId: "show_sukuna_armor_diaries", seasonNumber: 1, title: "Foam to finale", episodeCount: 6, releasedAt: daysAgo(45) },
  // Lagos After Dark — S1 (8)
  { id: "season_lagos_s1", showId: "show_lagos_after_dark", seasonNumber: 1, title: "After-hours Lagos", episodeCount: 8, releasedAt: daysAgo(30) },
  // Continent Tech — S1+S2+S3 (8 each)
  { id: "season_tech_s1", showId: "show_continent_tech", seasonNumber: 1, title: "Year one", episodeCount: 8, releasedAt: daysAgo(200) },
  { id: "season_tech_s2", showId: "show_continent_tech", seasonNumber: 2, title: "Year two", episodeCount: 8, releasedAt: daysAgo(120) },
  { id: "season_tech_s3", showId: "show_continent_tech", seasonNumber: 3, title: "Year three", episodeCount: 8, releasedAt: daysAgo(20) },
];

interface EpisodeSeed {
  title: string;
  synopsis: string;
  runtimeSec: number;
  releasedDaysAgo: number;
}

function buildEpisodes(
  showId: string,
  seasonId: string,
  seasonNumber: number,
  seed: EpisodeSeed[],
): Episode[] {
  const SHOW_INTRO_LEN = 12;
  return seed.map((e, idx) => ({
    id: `${seasonId}_e${idx + 1}`,
    showId,
    seasonId,
    seasonNumber,
    episodeNumber: idx + 1,
    title: e.title,
    synopsis: e.synopsis,
    thumbnailUrl: streamThumb(`${seasonId}_e${idx + 1}`),
    runtimeSec: e.runtimeSec,
    hlsUrl: "/demo/sample.m3u8",
    introStartSec: 6,
    introEndSec: 6 + SHOW_INTRO_LEN,
    premiereAt: daysAgo(e.releasedDaysAgo),
    releasedAt: daysAgo(e.releasedDaysAgo),
  }));
}

export const episodes: Episode[] = [
  ...buildEpisodes("show_naija_esports_inside", "season_naija_s1", 1, [
    { title: "Lagos team-house tour", synopsis: "Inside Team Alpha's apartment-block bootcamp.", runtimeSec: 1620, releasedDaysAgo: 115 },
    { title: "Practice-day rituals", synopsis: "Pre-scrim warm-ups, custom-loadout debates.", runtimeSec: 1740, releasedDaysAgo: 100 },
    { title: "Road to Casablanca", synopsis: "First-ever cross-region travel for an African mobile esports squad.", runtimeSec: 1900, releasedDaysAgo: 80 },
    { title: "Finals day — through the headset", synopsis: "Locker-room mic from kick-off to trophy lift.", runtimeSec: 2100, releasedDaysAgo: 60 },
  ]),
  ...buildEpisodes("show_naija_esports_inside", "season_naija_s2", 2, [
    { title: "Why we picked up CoD Mobile", synopsis: "The strategy meeting that birthed Alpha's second squad.", runtimeSec: 1500, releasedDaysAgo: 25 },
    { title: "Coach swap mid-season", synopsis: "The decision nobody saw coming.", runtimeSec: 1620, releasedDaysAgo: 18 },
    { title: "Nairobi Open recap", synopsis: "Three matches, two upsets, one absolute clutch.", runtimeSec: 1800, releasedDaysAgo: 10 },
    { title: "What's next: PUBG", synopsis: "Three months out from the announcement.", runtimeSec: 1680, releasedDaysAgo: 3 },
  ]),
  ...buildEpisodes("show_otaku_court", "season_otaku_s1", 1, [
    { title: "Is Frieren actually slow?", synopsis: "The court rules on pacing complaints.", runtimeSec: 2700, releasedDaysAgo: 88 },
    { title: "JJK manga vs anime — the verdict", synopsis: "When does adaptation pacing go wrong?", runtimeSec: 2820, releasedDaysAgo: 75 },
    { title: "Demon Slayer S4 expectations", synopsis: "Pre-premiere predictions show.", runtimeSec: 2600, releasedDaysAgo: 60 },
    { title: "Shounen tropes — necessary or not?", synopsis: "Friendship, training arcs, the works.", runtimeSec: 2880, releasedDaysAgo: 50 },
    { title: "Best fight scene of the year", synopsis: "Community-submitted clips, judged live.", runtimeSec: 3000, releasedDaysAgo: 40 },
    { title: "Season 1 verdicts: revisited", synopsis: "Three months later — what did the court get wrong?", runtimeSec: 2700, releasedDaysAgo: 25 },
  ]),
  ...buildEpisodes("show_otaku_court", "season_otaku_s2", 2, [
    { title: "Live anime release calendar overhaul", synopsis: "Why subs/dubs shifted in 2026.", runtimeSec: 2700, releasedDaysAgo: 18 },
    { title: "Manga publishers vs streaming", synopsis: "The economics nobody talks about.", runtimeSec: 2880, releasedDaysAgo: 14 },
    { title: "Cosplay etiquette", synopsis: "Boundary debate. Long overdue.", runtimeSec: 2700, releasedDaysAgo: 9 },
    { title: "Best opening of the decade", synopsis: "The brackets, the picks, the salt.", runtimeSec: 3000, releasedDaysAgo: 6 },
    { title: "Niche anime everyone missed", synopsis: "Court rules on under-watched gems.", runtimeSec: 2820, releasedDaysAgo: 3 },
    { title: "Community trial: this season's MVP", synopsis: "Audience votes live.", runtimeSec: 2700, releasedDaysAgo: 1 },
  ]),
  ...buildEpisodes("show_sukuna_armor_diaries", "season_sukuna_s1", 1, [
    { title: "Episode 1 — Foam pattern fitting", synopsis: "Print + cut + tape-fit walkthrough.", runtimeSec: 2400, releasedDaysAgo: 45 },
    { title: "Episode 2 — Heat-shaping the chestplate", synopsis: "Curves without cracks.", runtimeSec: 2580, releasedDaysAgo: 40 },
    { title: "Episode 3 — EVA detailing", synopsis: "Where the texture comes from.", runtimeSec: 2700, releasedDaysAgo: 35 },
    { title: "Episode 4 — Base-coating", synopsis: "Plasti-dip, primer, anchor coats.", runtimeSec: 2520, releasedDaysAgo: 30 },
    { title: "Episode 5 — Weathering", synopsis: "Battle-damage techniques.", runtimeSec: 2640, releasedDaysAgo: 25 },
    { title: "Episode 6 — Finale: wearing it", synopsis: "Strap-up, photo session, post-mortem.", runtimeSec: 2820, releasedDaysAgo: 20 },
  ]),
  ...buildEpisodes("show_lagos_after_dark", "season_lagos_s1", 1, [
    { title: "Episode 1 — 11pm: the kitchens", synopsis: "Suya stands, late-night chefs, the smoke.", runtimeSec: 2520, releasedDaysAgo: 28 },
    { title: "Episode 2 — Midnight: drivers", synopsis: "Uber, danfo, road-runners.", runtimeSec: 2580, releasedDaysAgo: 25 },
    { title: "Episode 3 — 1am: club promoters", synopsis: "Who's working, who's spending.", runtimeSec: 2700, releasedDaysAgo: 21 },
    { title: "Episode 4 — 2am: the dancers", synopsis: "Routines, choreography, the after-after.", runtimeSec: 2640, releasedDaysAgo: 18 },
    { title: "Episode 5 — 3am: studios", synopsis: "Where Lagos pop is recorded.", runtimeSec: 2880, releasedDaysAgo: 14 },
    { title: "Episode 6 — 4am: the markets", synopsis: "Fish, produce, the loading docks.", runtimeSec: 2520, releasedDaysAgo: 10 },
    { title: "Episode 7 — 5am: the dawn ravers", synopsis: "Beach parties at sunrise.", runtimeSec: 2700, releasedDaysAgo: 6 },
    { title: "Episode 8 — 6am: shift change", synopsis: "Where night ends and day begins.", runtimeSec: 2820, releasedDaysAgo: 2 },
  ]),
  ...buildEpisodes("show_continent_tech", "season_tech_s3", 3, [
    { title: "Nairobi AI labs — the founder interviews", synopsis: "Three startups, one corridor.", runtimeSec: 3300, releasedDaysAgo: 19 },
    { title: "Lagos fintech round-up", synopsis: "Who's lending, who's collecting.", runtimeSec: 3000, releasedDaysAgo: 16 },
    { title: "Cape Town SaaS scene", synopsis: "Bootstrapping vs venture in 2026.", runtimeSec: 3180, releasedDaysAgo: 12 },
    { title: "Accra dev tools week", synopsis: "Conferences, code, contracts.", runtimeSec: 3060, releasedDaysAgo: 9 },
    { title: "Egypt crypto reset", synopsis: "Post-regulation interviews.", runtimeSec: 3240, releasedDaysAgo: 6 },
    { title: "Continent-wide developer survey", synopsis: "Year-three findings.", runtimeSec: 3360, releasedDaysAgo: 3 },
    { title: "Founders who left and came back", synopsis: "Return-migration stories.", runtimeSec: 3120, releasedDaysAgo: 2 },
    { title: "What's next: Year four", synopsis: "Predictions show.", runtimeSec: 2700, releasedDaysAgo: 0 },
  ]),
];

export async function listShows(filter?: {
  pillar?: ContentPillar;
  originType?: ShowOriginType;
  status?: ShowStatus;
}): Promise<Show[]> {
  await sleep(120);
  let result = shows;
  if (filter?.pillar) result = result.filter((s) => s.pillar === filter.pillar);
  if (filter?.originType)
    result = result.filter((s) => s.originType === filter.originType);
  if (filter?.status) result = result.filter((s) => s.status === filter.status);
  return result.sort((a, b) => b.rating - a.rating);
}

export async function getShowBySlug(slug: string): Promise<Show | null> {
  await sleep(80);
  return shows.find((s) => s.slug === slug) ?? null;
}

export async function listSeasonsForShow(showId: string): Promise<Season[]> {
  await sleep(80);
  return seasons
    .filter((s) => s.showId === showId)
    .sort((a, b) => a.seasonNumber - b.seasonNumber);
}

export async function listEpisodesForSeason(seasonId: string): Promise<Episode[]> {
  await sleep(80);
  return episodes
    .filter((e) => e.seasonId === seasonId)
    .sort((a, b) => a.episodeNumber - b.episodeNumber);
}

export async function getEpisodeById(id: string): Promise<Episode | null> {
  await sleep(80);
  return episodes.find((e) => e.id === id) ?? null;
}

/* ── Continue watching + watchlist (AsyncStorage-backed) ─────────────── */

const PROGRESS_KEY = "evotv_episode_progress_v1";
const WATCHLIST_KEY = "evotv_show_watchlist_v1";
const SEED_USER_ID = "user_self";

function loadProgress(): Record<string, EpisodeProgress> {
  try {
    const raw = syncGet(PROGRESS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, EpisodeProgress>;
  } catch {
    return {};
  }
}

function saveProgress(progress: Record<string, EpisodeProgress>) {
  try {
    syncSet(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    /* noop */
  }
}

export async function getEpisodeProgress(
  episodeId: string,
): Promise<EpisodeProgress | null> {
  const map = loadProgress();
  return map[episodeId] ?? null;
}

export async function setEpisodeProgress(
  episodeId: string,
  positionSec: number,
  completed = false,
): Promise<void> {
  const map = loadProgress();
  const now = new Date().toISOString();
  map[episodeId] = {
    userId: SEED_USER_ID,
    episodeId,
    positionSec,
    completedAt: completed ? now : null,
    updatedAt: now,
  };
  saveProgress(map);
}

/** Top-N episodes with progress > 0 + not completed, ordered by recency. */
export async function listContinueWatching(limit = 6): Promise<
  Array<{ episode: Episode; show: Show; progress: EpisodeProgress }>
> {
  await sleep(60);
  const map = loadProgress();
  const inProgress = Object.values(map)
    .filter((p) => !p.completedAt && p.positionSec > 0)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit);
  const enriched = inProgress
    .map((p) => {
      const ep = episodes.find((e) => e.id === p.episodeId);
      if (!ep) return null;
      const sh = shows.find((s) => s.id === ep.showId);
      if (!sh) return null;
      return { episode: ep, show: sh, progress: p };
    })
    .filter((r): r is { episode: Episode; show: Show; progress: EpisodeProgress } => r !== null);
  return enriched;
}

function loadWatchlist(): Record<string, ShowWatchlist> {
  try {
    const raw = syncGet(WATCHLIST_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ShowWatchlist>;
  } catch {
    return {};
  }
}

function saveWatchlist(list: Record<string, ShowWatchlist>) {
  try {
    syncSet(WATCHLIST_KEY, JSON.stringify(list));
  } catch {
    /* noop */
  }
}

export async function getWatchlistEntry(
  showId: string,
): Promise<ShowWatchlist | null> {
  const map = loadWatchlist();
  return map[showId] ?? null;
}

export async function setWatchlistStatus(
  showId: string,
  status: WatchlistStatus | null,
): Promise<void> {
  const map = loadWatchlist();
  if (status === null) {
    delete map[showId];
  } else {
    const existing = map[showId];
    map[showId] = {
      userId: SEED_USER_ID,
      showId,
      status,
      addedAt: existing?.addedAt ?? new Date().toISOString(),
    };
  }
  saveWatchlist(map);
}

export async function listMyWatchlist(
  status?: WatchlistStatus,
): Promise<Array<{ show: Show; entry: ShowWatchlist }>> {
  await sleep(80);
  const map = loadWatchlist();
  const entries = Object.values(map);
  const filtered = status ? entries.filter((e) => e.status === status) : entries;
  return filtered
    .map((e) => {
      const sh = shows.find((s) => s.id === e.showId);
      return sh ? { show: sh, entry: e } : null;
    })
    .filter((r): r is { show: Show; entry: ShowWatchlist } => r !== null)
    .sort(
      (a, b) =>
        new Date(b.entry.addedAt).getTime() - new Date(a.entry.addedAt).getTime(),
    );
}
