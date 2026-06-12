import type { MaturityRating, Stream } from "@/lib/types";
import { api, ApiError } from "./_client";

export interface ListStreamsOpts {
  gameId?: string;
  isPremium?: boolean;
}

/** GET /api/streams?gameId=&isPremium=  - live streams */
export function listLiveStreams(opts: ListStreamsOpts = {}): Promise<Stream[]> {
  return api<Stream[]>("/api/streams", {
    query: { gameId: opts.gameId, isPremium: opts.isPremium },
  });
}

/** GET /api/streams?featured=1 */
export function listFeaturedStreams(): Promise<Stream[]> {
  return api<Stream[]>("/api/streams", { query: { featured: "1" } });
}

/** GET /api/streams/[id]. Returns null on 404 so callers (stream detail,
 *  embed player, multi-stream resolves) can render an empty state without
 *  catching ApiError themselves. */
export async function getStreamById(id: string): Promise<Stream | null> {
  try {
    return await api<Stream>(`/api/streams/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** Convenience: the main 24/7 channel stream. */
export async function getMainChannel(): Promise<Stream | null> {
  try {
    return await api<Stream>("/api/streams/channel_main");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/**
 * POST /api/streams/[id]/heartbeat - viewer-minute ping.
 *
 * Backend dedupes per (channelId, viewer-key, minute_bucket) so calling
 * this every 60s while watching is safe. Anonymous viewers get an ip_hash
 * key server-side; authed viewers use their userId.
 */
export async function sendStreamHeartbeat(
  streamId: string,
): Promise<{ ok: true; accounted: boolean }> {
  return api<{ ok: true; accounted: boolean }>(
    `/api/streams/${encodeURIComponent(streamId)}/heartbeat`,
    { method: "POST" },
  );
}

/**
 * DELETE /api/streams/[id]/heartbeat - viewer is leaving.
 *
 * Drops the caller's recent watch_events rows for this stream so the
 * count drops immediately instead of decaying over the 90s read-window.
 * Fire from useStreamHeartbeat cleanup.
 */
export async function stopStreamHeartbeat(
  streamId: string,
): Promise<{ ok: true }> {
  return api<{ ok: true }>(
    `/api/streams/${encodeURIComponent(streamId)}/heartbeat`,
    { method: "DELETE" },
  );
}

export interface ListAdminStreamsOpts {
  gameId?: string;
  isLive?: boolean;
  /** 'only' = deleted only; 'include' = active + deleted; undefined = active only. */
  deleted?: "only" | "include";
  limit?: number;
  offset?: number;
}

export interface ListAdminStreamsResult {
  streams: Stream[];
  total: number;
  limit: number;
  offset: number;
}

/** POST /api/admin/streams/[id]/force-end - moderator+. */
export async function adminForceEndStream(
  id: string,
  reason?: string,
): Promise<{ ok: true; streamId: string; endedAt: string }> {
  return api(`/api/admin/streams/${id}/force-end`, {
    method: "POST",
    body: reason ? { reason } : {},
  });
}

/** DELETE /api/admin/streams/[id] - admin+. Force-ends if live, then soft-deletes. */
export async function adminDeleteStream(
  id: string,
): Promise<{ ok: true; streamId: string; deletedAt: string }> {
  return api(`/api/admin/streams/${id}`, { method: "DELETE" });
}

/** POST /api/admin/streams/[id]/restore - admin+. Un-soft-deletes. */
export async function adminRestoreStream(
  id: string,
): Promise<{ ok: true; streamId: string }> {
  return api(`/api/admin/streams/${id}/restore`, { method: "POST", body: {} });
}

/**
 * PATCH /api/admin/streams/[id] - support_admin+.
 * Programs the EPG airtime and/or the HLS playback URL. Pass null to clear a
 * field. `hlsUrl` accepts a full http(s) manifest (e.g. a Cloudflare Stream
 * `.m3u8`) or a relative origin path; "" / null clears it.
 */
export async function adminUpdateStreamSchedule(
  id: string,
  body: {
    scheduledStartAt?: string | null;
    scheduledDurationMin?: number | null;
    hlsUrl?: string | null;
    playoutFilePath?: string | null;
    maturityRating?: MaturityRating | null;
    contentTags?: string[] | null;
  },
): Promise<{
  ok: true;
  streamId: string;
  scheduledStartAt?: string | null;
  scheduledDurationMin?: number | null;
  hlsPath?: string;
  playoutFilePath?: string | null;
  maturityRating?: MaturityRating | null;
  contentTags?: string[] | null;
}> {
  return api(`/api/admin/streams/${id}`, { method: "PATCH", body });
}

/** Mirrors the backend createSchema (EVOTV/app/api/admin/streams/route.ts). */
export interface AdminCreateStreamPayload {
  /** 3-200 chars. */
  title: string;
  /** Max 2000 chars. Backend defaults to "". */
  description?: string;
  gameId: string;
  eventId?: string | null;
  /** 1-100 chars. */
  streamerName: string;
  streamerAvatarUrl?: string;
  /** Backend defaults to "en". */
  language?: string;
  tags?: string[];
  isPremium?: boolean;
  /** Backend defaults to "teen". */
  maturityRating?: MaturityRating;
  contentTags?: string[];
}

export interface AdminCreateStreamResult {
  id: string;
  /** Shown ONLY once. Surface to the admin immediately; never recoverable. */
  streamKey: string;
  ingestUrl: string;
  warning: string;
}

/**
 * POST /api/admin/streams - admin only. Creates an offline stream row with a
 * fresh ingest key. The response streamKey is the only time the full key is
 * visible (backend stores a hash) - callers MUST show it to the admin with a
 * copy affordance before dropping it.
 */
export async function adminCreateStream(
  payload: AdminCreateStreamPayload,
): Promise<AdminCreateStreamResult> {
  return api<AdminCreateStreamResult>("/api/admin/streams", {
    method: "POST",
    body: payload,
  });
}

/** GET /api/admin/streams - admin only. All streams (live + offline). */
export async function listAdminStreams(
  opts: ListAdminStreamsOpts = {},
): Promise<ListAdminStreamsResult> {
  const q = new URLSearchParams();
  if (opts.gameId) q.set("gameId", opts.gameId);
  if (typeof opts.isLive === "boolean") q.set("isLive", String(opts.isLive));
  if (opts.deleted) q.set("deleted", opts.deleted);
  if (opts.limit) q.set("limit", String(opts.limit));
  if (opts.offset) q.set("offset", String(opts.offset));
  const qs = q.toString();
  return api<ListAdminStreamsResult>(
    `/api/admin/streams${qs ? `?${qs}` : ""}`,
  );
}
