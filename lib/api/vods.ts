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

/** GET /api/trending/clips — backend wraps in `{ clips: [...] }`. */
export async function listTrendingClips(limit = 10): Promise<Clip[]> {
  const res = await api<{ clips: Clip[] }>("/api/trending/clips", {
    query: { limit },
  });
  return res.clips ?? [];
}

/** GET /api/vods/clips/[id] */
export function getClipById(id: string): Promise<Clip | null> {
  return api<Clip | null>(`/api/vods/clips/${id}`);
}

export interface ListAdminVodsOpts {
  gameId?: string;
  channelId?: string;
  /** 'only' = deleted only; 'include' = active + deleted; undefined = active only. */
  deleted?: "only" | "include";
  limit?: number;
  offset?: number;
}

export interface AdminVod extends Vod {
  deletedAt?: string | null;
  channelId?: string | null;
}

export interface AdminClip extends Clip {
  deletedAt?: string | null;
  channelId?: string | null;
}

export async function listAdminVods(opts: ListAdminVodsOpts = {}): Promise<{
  vods: AdminVod[];
  total: number;
  limit: number;
  offset: number;
}> {
  return api(`/api/admin/vods`, {
    query: {
      gameId: opts.gameId,
      channelId: opts.channelId,
      deleted: opts.deleted,
      limit: opts.limit,
      offset: opts.offset,
    },
  });
}

export async function listAdminClips(opts: ListAdminVodsOpts = {}): Promise<{
  clips: AdminClip[];
  total: number;
  limit: number;
  offset: number;
}> {
  return api(`/api/admin/clips`, {
    query: {
      gameId: opts.gameId,
      channelId: opts.channelId,
      deleted: opts.deleted,
      limit: opts.limit,
      offset: opts.offset,
    },
  });
}

export async function adminDeleteVod(id: string): Promise<{
  ok: true;
  vodId: string;
  deletedAt: string;
}> {
  return api(`/api/admin/vods/${id}`, { method: "DELETE" });
}

export async function adminRestoreVod(id: string): Promise<{
  ok: true;
  vodId: string;
}> {
  return api(`/api/admin/vods/${id}/restore`, { method: "POST", body: {} });
}

export async function adminDeleteClip(id: string): Promise<{
  ok: true;
  clipId: string;
  deletedAt: string;
}> {
  return api(`/api/admin/clips/${id}`, { method: "DELETE" });
}

export async function adminRestoreClip(id: string): Promise<{
  ok: true;
  clipId: string;
}> {
  return api(`/api/admin/clips/${id}/restore`, { method: "POST", body: {} });
}
