import type { Vod } from "@/lib/types";
import { api } from "./_client";

export interface RecommendationsResult {
  items: Vod[];
  source: "personalized" | "trending";
}

/** GET /api/recommendations?limit=  — falls back to trending for guests. */
export function listRecommendations(limit = 20): Promise<RecommendationsResult> {
  return api<RecommendationsResult>("/api/recommendations", {
    query: { limit },
  });
}
