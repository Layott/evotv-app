import type { Game } from "@/lib/types";
import { api } from "./_client";

/** GET /api/games — returns the full game catalog. */
export function listGames(): Promise<Game[]> {
  return api<Game[]>("/api/games");
}

/**
 * Backend exposes only the list route. Client-side filter for id/slug lookup
 * to keep call-site signatures matching `lib/mock/games.ts`. Cache via TanStack
 * Query so we don't re-fetch the list per lookup.
 */
export async function getGameById(id: string): Promise<Game | null> {
  const games = await listGames();
  return games.find((g) => g.id === id) ?? null;
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  const games = await listGames();
  return games.find((g) => g.slug === slug) ?? null;
}
