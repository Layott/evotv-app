import { api } from "./_client";

/**
 * The flagship channel and what is on it.
 *
 * One request on purpose. It drives the fixed hero at the top of home, and
 * splitting it would make that hero pop in piece by piece on every open.
 *
 * The channel comes back even when it is off air, which is the point of it: a
 * hero that disappears between broadcasts leaves a hole where the identity of
 * the app should be, and what a viewer needs at that moment is not "nothing
 * here" but "back at 20:00 with Otaku and Chills".
 *
 * Mirrors GET /api/channel/main. `channel` is null until an operator marks a
 * stream as the main channel in admin.
 */

/** One programme in the guide. Matches EpgRow on the backend. */
export interface ChannelProgramme {
  id: string;
  kind: "grid" | "dated";
  pillar: "esports" | "anime" | "lifestyle";
  title: string;
  subtitle: string;
  thumbnailUrl: string;
  /** ISO 8601. */
  airsAt: string;
  durationMin: number;
  watchUrl: string;
  state: "live" | "upcoming" | "past";
}

export interface MainChannel {
  id: string;
  title: string;
  tagline: string;
  posterUrl: string;
  thumbnailUrl: string;
  isLive: boolean;
  hlsUrl: string;
  /** Present when the stream is gated: watching needs an account. */
  requiresAuth?: true;
  viewerCount: number;
  startedAt: string | null;
}

export interface MainChannelResponse {
  channel: MainChannel | null;
  onNow: ChannelProgramme | null;
  upNext: ChannelProgramme[];
}

export async function getMainChannel(): Promise<MainChannelResponse> {
  return api<MainChannelResponse>("/api/channel/main");
}
