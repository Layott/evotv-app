import { api } from "./_client";

/**
 * Row shape returned by GET /api/users/me/vod-progress — a vod_progress row
 * joined with the parent VOD so the client renders without a second fetch.
 */
export interface VodProgressEntry {
  vodId: string;
  positionSec: number;
  updatedAt: string;
  title: string;
  thumbnailUrl: string;
  durationSec: number;
  gameId: string;
  isPremium: boolean;
  pillar: "esports" | "anime" | "lifestyle" | null;
}

/**
 * Recent watch history for the signed-in user. Drives the History tab on
 * /library. Soft-deleted VODs are filtered out server-side.
 */
export function listMyVodProgress(limit = 20): Promise<VodProgressEntry[]> {
  return api<VodProgressEntry[]>(`/api/users/me/vod-progress`, {
    query: { limit },
  });
}
