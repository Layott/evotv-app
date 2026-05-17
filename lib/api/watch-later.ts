import { api } from "./_client";

export interface WatchLaterEntry {
  vodId: string;
  createdAt: string;
  title: string;
  thumbnailUrl: string;
  durationSec: number;
  gameId: string;
  isPremium: boolean;
  pillar: "esports" | "anime" | "lifestyle" | null;
}

/** GET /api/users/me/watch-later — list bookmarks joined with VOD details. */
export function listWatchLater(limit = 50): Promise<WatchLaterEntry[]> {
  return api<WatchLaterEntry[]>(`/api/users/me/watch-later`, {
    query: { limit },
  });
}

/** GET /api/users/me/watch-later/[vodId] — current bookmark state. */
export function getBookmark(vodId: string): Promise<{ bookmarked: boolean }> {
  return api<{ bookmarked: boolean }>(
    `/api/users/me/watch-later/${vodId}`,
  );
}

/** POST /api/users/me/watch-later/[vodId] — add. Idempotent. */
export function addBookmark(vodId: string): Promise<{ bookmarked: boolean }> {
  return api(`/api/users/me/watch-later/${vodId}`, { method: "POST", body: {} });
}

/** DELETE /api/users/me/watch-later/[vodId] — remove. Idempotent. */
export function removeBookmark(
  vodId: string,
): Promise<{ bookmarked: boolean }> {
  return api(`/api/users/me/watch-later/${vodId}`, { method: "DELETE" });
}
