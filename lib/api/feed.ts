import type { Clip, EsportsEvent, Stream, Vod } from "@/lib/types";
import { api } from "./_client";

export interface HomeFeed {
  hero: Stream[];
  live: Stream[];
  upcoming: EsportsEvent[];
  recommendations: Vod[];
  trendingClips: Clip[];
}

/** GET /api/feed/home — single aggregate call for the home screen. */
export function getHomeFeed(): Promise<HomeFeed> {
  return api<HomeFeed>("/api/feed/home");
}
