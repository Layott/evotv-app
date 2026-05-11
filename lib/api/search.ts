import type { Clip, EsportsEvent, Game, Player, Stream, Team, Vod } from "@/lib/types";
import { api } from "./_client";

export interface SearchResults {
  games: Game[];
  teams: Team[];
  players: Player[];
  events: EsportsEvent[];
  streams: Stream[];
  vods: Vod[];
  clips: Clip[];
}

/** GET /api/search?q= */
export function globalSearch(query: string): Promise<SearchResults> {
  return api<SearchResults>("/api/search", { query: { q: query } });
}

/** GET /api/search?q=&suggest=1&limit= */
export function searchSuggestions(query: string, limit = 8): Promise<string[]> {
  return api<string[]>("/api/search", {
    query: { q: query, suggest: "1", limit },
  });
}
