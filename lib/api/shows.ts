import type {
  ContentPillar,
  Episode,
  Season,
  Show,
  ShowOriginType,
  ShowStatus,
  ShowWatchlist,
  WatchlistStatus,
} from "@/lib/types";
import { api, ApiError } from "./_client";

/**
 * Phase 9b — real backend. Mirrors the mock signatures in lib/mock/shows.ts
 * so swap is one import-rename per call site. Continue-watching + watchlist
 * shape adapted to the backend envelopes.
 */

export async function listShows(filter?: {
  pillar?: ContentPillar;
  originType?: ShowOriginType;
  status?: ShowStatus;
}): Promise<Show[]> {
  const query: Record<string, string | undefined> = {};
  if (filter?.pillar) query.pillar = filter.pillar;
  if (filter?.originType) query.origin = filter.originType;
  if (filter?.status) query.status = filter.status;
  const res = await api<{ shows: Show[] }>("/api/originals", { query });
  return res.shows ?? [];
}

export async function getShowBySlug(slug: string): Promise<Show | null> {
  try {
    const res = await api<{ show: Show; seasons: Season[] }>(
      `/api/shows/${encodeURIComponent(slug)}`,
    );
    return res.show;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function getShowWithSeasonsBySlug(
  slug: string,
): Promise<{ show: Show; seasons: Season[] } | null> {
  try {
    return await api<{ show: Show; seasons: Season[] }>(
      `/api/shows/${encodeURIComponent(slug)}`,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function listSeasonsForShow(showId: string): Promise<Season[]> {
  // No standalone endpoint — caller can use getShowWithSeasonsBySlug instead.
  // This signature exists for parity with the mock; it returns [] to keep
  // call sites happy without an extra round-trip.
  void showId;
  return [];
}

export async function listEpisodesForSeason(seasonId: string): Promise<Episode[]> {
  const res = await api<{ episodes: Episode[] }>(
    `/api/seasons/${encodeURIComponent(seasonId)}/episodes`,
  );
  return res.episodes ?? [];
}

export async function setEpisodeProgress(
  episodeId: string,
  positionSec: number,
  completed = false,
): Promise<void> {
  await api(`/api/episodes/${encodeURIComponent(episodeId)}/progress`, {
    method: "POST",
    body: { positionSec, completed },
  });
}

export interface EpisodeProgressEntry {
  positionSec: number;
  updatedAt: string;
  completed: boolean;
}

/** GET /api/episodes/[id]/progress — saved position or null if unwatched. */
export function getEpisodeProgress(
  episodeId: string,
): Promise<EpisodeProgressEntry | null> {
  return api<EpisodeProgressEntry | null>(
    `/api/episodes/${encodeURIComponent(episodeId)}/progress`,
  );
}

export interface ContinueWatchingRow {
  episode: Episode;
  show: Show;
  positionSec: number;
}

export async function listContinueWatching(
  limit = 6,
): Promise<ContinueWatchingRow[]> {
  try {
    const res = await api<{ items: ContinueWatchingRow[] }>(
      "/api/originals/continue-watching",
      { query: { limit } },
    );
    return res.items ?? [];
  } catch (err) {
    // Continue-watching is auth-gated. Guests get empty rail instead of crash.
    if (err instanceof ApiError && err.status === 401) return [];
    throw err;
  }
}

export async function getWatchlistEntry(
  showId: string,
): Promise<ShowWatchlist | null> {
  try {
    const res = await api<{ entry: ShowWatchlist | null }>(
      `/api/watchlist/${encodeURIComponent(showId)}`,
    );
    return res.entry;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export async function setWatchlistStatus(
  showId: string,
  status: WatchlistStatus | null,
): Promise<void> {
  if (status === null) {
    await api(`/api/watchlist/${encodeURIComponent(showId)}`, {
      method: "DELETE",
    });
    return;
  }
  await api(`/api/watchlist/${encodeURIComponent(showId)}`, {
    method: "PUT",
    body: { status },
  });
}
