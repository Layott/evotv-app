import { api } from "./_client";

/**
 * The Shows CMS, from the phone.
 *
 * The same endpoints the web dashboard uses. This exists because uploading is
 * often the one job that is easier on a handset than at a desk: the footage is
 * already on the phone that shot it, and the alternative is AirDropping it to a
 * laptop first.
 *
 * Read paths for shows live in `shows.ts`. These are the write paths, and every
 * one of them needs an admin session.
 */

export type ShowPillar = "esports" | "anime" | "lifestyle";
export type ShowOriginType = "evo_original" | "licensed" | "syndicated";
export type ShowStatus = "airing" | "completed" | "upcoming" | "hiatus";
export type MaturityRating = "kids" | "pg" | "teen" | "mature";

export interface SocialLink {
  platform: string;
  url: string;
}

/** From day N after release, this is the price. Zero is free from then on. */
export interface PriceWindow {
  fromDay: number;
  priceNgn: number;
}

export interface AdminShow {
  id: string;
  /** Derived from the title. Not settable, so it can never disagree with it. */
  slug: string;
  title: string;
  synopsis: string;
  heroUrl: string;
  posterUrl: string;
  pillar: ShowPillar;
  originType: ShowOriginType;
  /** Derived from the episodes and the grid. Read-only here. */
  status: ShowStatus;
  primaryCreatorHandle: string;
  socialLinks: SocialLink[];
  totalSeasons: number;
  totalEpisodes: number;
  rating: number;
  releasedAt: string | null;
  tags: string[];
  isPremium: boolean;
  maturityRating: MaturityRating;
  contentTags: string[];
  endedAt: string | null;
  deletedAt: string | null;
}

export interface AdminSeason {
  id: string;
  showId: string;
  seasonNumber: number;
  title: string;
  episodeCount: number;
  releasedAt: string | null;
}

export interface AdminEpisode {
  id: string;
  showId: string;
  seasonId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  synopsis: string;
  thumbnailUrl: string;
  runtimeSec: number;
  hlsUrl: string;
  premiereAt: string | null;
  releasedAt: string | null;
  isPremium: boolean;
  maturityRating: MaturityRating;
  contentTags: string[];
  deletedAt: string | null;
}

export interface AdminShowDetail {
  show: AdminShow;
  seasons: AdminSeason[];
  episodes: AdminEpisode[];
  priceWindows: PriceWindow[];
}

/* ── Shows ──────────────────────────────────────────────────────────────── */

export async function adminListShows(opts: {
  pillar?: ShowPillar;
  deleted?: "only" | "include";
  limit?: number;
} = {}): Promise<{ shows: AdminShow[]; total: number }> {
  return api("/api/admin/shows", {
    query: { pillar: opts.pillar, deleted: opts.deleted, limit: opts.limit ?? 100 },
  });
}

export async function adminGetShow(id: string): Promise<AdminShowDetail> {
  return api(`/api/admin/shows/${id}`);
}

/**
 * What may be set on a show.
 *
 * No slug and no status: one is derived from the title, the other from the
 * episodes and the grid. Sending either is ignored server-side rather than
 * honoured, so they are left out here to keep the screen honest about what it
 * can actually change.
 */
export interface AdminShowPayload {
  title: string;
  synopsis?: string;
  pillar?: ShowPillar;
  originType?: ShowOriginType;
  primaryCreatorHandle?: string;
  socialLinks?: SocialLink[];
  posterUrl?: string;
  heroUrl?: string;
  tags?: string[];
  isPremium?: boolean;
  priceWindows?: PriceWindow[];
  maturityRating?: MaturityRating;
  releasedAt?: string | null;
  endedAt?: string | null;
}

export async function adminCreateShow(payload: AdminShowPayload): Promise<AdminShow> {
  return api("/api/admin/shows", { method: "POST", body: payload });
}

export async function adminUpdateShow(
  id: string,
  patch: Partial<AdminShowPayload>,
): Promise<{ show: AdminShow }> {
  return api(`/api/admin/shows/${id}`, { method: "PATCH", body: patch });
}

export async function adminDeleteShow(id: string): Promise<{ ok: true }> {
  return api(`/api/admin/shows/${id}`, { method: "DELETE" });
}

/* ── Seasons ────────────────────────────────────────────────────────────── */

export async function adminCreateSeason(
  showId: string,
  payload: { seasonNumber?: number; title?: string } = {},
): Promise<{ season: AdminSeason }> {
  return api(`/api/admin/shows/${showId}/seasons`, { method: "POST", body: payload });
}

export async function adminUpdateSeason(
  id: string,
  patch: { seasonNumber?: number; title?: string },
): Promise<{ season: AdminSeason }> {
  return api(`/api/admin/seasons/${id}`, { method: "PATCH", body: patch });
}

/** Refused while the season still holds episodes. */
export async function adminDeleteSeason(id: string): Promise<{ ok: true }> {
  return api(`/api/admin/seasons/${id}`, { method: "DELETE" });
}

/* ── Episodes ───────────────────────────────────────────────────────────── */

export interface AdminEpisodePayload {
  seasonId: string;
  episodeNumber?: number;
  title: string;
  synopsis?: string;
  thumbnailUrl?: string;
  hlsUrl?: string;
  runtimeSec?: number;
  /** Omit to inherit the show's tier rather than defaulting to free. */
  isPremium?: boolean;
  releasedAt?: string | null;
}

export async function adminCreateEpisode(
  showId: string,
  payload: AdminEpisodePayload,
): Promise<{ episode: AdminEpisode }> {
  return api(`/api/admin/shows/${showId}/episodes`, { method: "POST", body: payload });
}

export async function adminUpdateEpisode(
  id: string,
  patch: Partial<Omit<AdminEpisodePayload, "seasonId">>,
): Promise<{ episode: AdminEpisode }> {
  return api(`/api/admin/episodes/${id}`, { method: "PATCH", body: patch });
}

export async function adminDeleteEpisode(id: string): Promise<{ ok: true }> {
  return api(`/api/admin/episodes/${id}`, { method: "DELETE" });
}
