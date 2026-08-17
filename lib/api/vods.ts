import type { Clip, ContentPillar, MaturityRating, Vod } from "@/lib/types";
import { api } from "./_client";

/** Editable content metadata shared by admin VOD + clip PATCH endpoints. */
export interface AdminContentMetaPatch {
  maturityRating?: MaturityRating | null;
  contentTags?: string[] | null;
  /** Public blob URL from pickAndUploadImage. PATCH-only re-upload affordance. */
  thumbnailUrl?: string;
}

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

/** GET /api/trending/clips - backend wraps in `{ clips: [...] }`. */
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
  /**
   * What it was cut from. The public `Clip` type does not carry these because
   * the viewer-facing rails do not need them, but the admin list does: they are
   * the link that puts a clip next to the show it came out of.
   */
  showId?: string | null;
  episodeId?: string | null;
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

/** Mirrors the backend POST /api/admin/vods create contract. */
export interface CreateAdminVodPayload {
  title: string;
  gameId: string;
  /** Public blob URL from pickAndUploadVideo (client upload, up to 512 MB). */
  mp4Url: string;
  hlsUrl?: string;
  /** Public blob URL from pickAndUploadImage. */
  thumbnailUrl: string;
  durationSec: number;
  description?: string;
  pillar?: ContentPillar;
  maturityRating?: MaturityRating;
  isPremium?: boolean;
  contentTags?: string[];
}

/** POST /api/admin/vods - admin only. Creates a VOD from uploaded media. */
export async function createAdminVod(
  payload: CreateAdminVodPayload,
): Promise<AdminVod> {
  return api<AdminVod>("/api/admin/vods", { method: "POST", body: payload });
}

/** Mirrors the backend POST /api/admin/clips create contract. */
export interface CreateAdminClipPayload {
  title: string;
  gameId: string;
  /** Public blob URL from pickAndUploadVideo. */
  mp4Url: string;
  /** Public blob URL from pickAndUploadImage. */
  thumbnailUrl: string;
  durationSec: number;
  /** Whose clip it is. Shown on the card, so the API requires it. */
  creatorHandle: string;
  creatorAvatarUrl?: string;
  pillar?: ContentPillar;
  maturityRating?: MaturityRating;
  contentTags?: string[];
  /**
   * What it was cut from. At most one is meaningful, and passing an episode
   * fills in its show server-side, so a clip cannot claim to belong to an
   * episode of a series it is not filed under.
   */
  vodId?: string | null;
  showId?: string | null;
  episodeId?: string | null;
}

/**
 * POST /api/admin/clips - admin only.
 *
 * Nothing in the app could write a clip before this, and neither could the
 * website until the library screen shipped there, so the clips rail could only
 * ever be filled by whatever inserted rows directly.
 */
export async function createAdminClip(
  payload: CreateAdminClipPayload,
): Promise<AdminClip> {
  const res = await api<{ clip: AdminClip }>("/api/admin/clips", {
    method: "POST",
    body: payload,
  });
  return res.clip;
}

/** PATCH /api/admin/vods/[id] - update content maturity + descriptor tags. */
export async function adminUpdateVod(
  id: string,
  patch: AdminContentMetaPatch,
): Promise<{
  ok: true;
  vodId: string;
  maturityRating?: MaturityRating | null;
  contentTags?: string[] | null;
}> {
  return api(`/api/admin/vods/${id}`, { method: "PATCH", body: patch });
}

/** PATCH /api/admin/clips/[id] - update content maturity + descriptor tags. */
export async function adminUpdateClip(
  id: string,
  patch: AdminContentMetaPatch,
): Promise<{
  ok: true;
  clipId: string;
  maturityRating?: MaturityRating | null;
  contentTags?: string[] | null;
}> {
  return api(`/api/admin/clips/${id}`, { method: "PATCH", body: patch });
}
