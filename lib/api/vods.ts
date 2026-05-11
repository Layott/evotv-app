import type { Clip, Vod } from "@/lib/types";
import { api } from "./_client";

export interface ListVodsOpts {
  gameId?: string;
  isPremium?: boolean;
  limit?: number;
}

/**
 * GET /api/vods?gameId=&isPremium=&limit=
 * Backend may ignore `limit` if not supported; mirror passes it for symmetry.
 * If backend returns more than `limit`, we slice client-side as a fallback.
 */
export async function listVods(opts: ListVodsOpts = {}): Promise<Vod[]> {
  const rows = await api<Vod[]>("/api/vods", {
    query: { gameId: opts.gameId, isPremium: opts.isPremium, limit: opts.limit },
  });
  return typeof opts.limit === "number" ? rows.slice(0, opts.limit) : rows;
}

/** GET /api/vods/[id] */
export function getVodById(id: string): Promise<Vod | null> {
  return api<Vod | null>(`/api/vods/${id}`);
}

/** GET /api/vods/[id]/related */
export function listRelatedVods(vodId: string, limit = 6): Promise<Vod[]> {
  return api<Vod[]>(`/api/vods/${vodId}/related`, { query: { limit } });
}

/** GET /api/trending/clips */
export function listTrendingClips(limit = 10): Promise<Clip[]> {
  return api<Clip[]>("/api/trending/clips", { query: { limit } });
}

/** GET /api/vods/clips/[id] */
export function getClipById(id: string): Promise<Clip | null> {
  return api<Clip | null>(`/api/vods/clips/${id}`);
}
