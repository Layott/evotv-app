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

export type CreateGamePayload = Omit<Game, "id">;
export type UpdateGamePayload = Partial<CreateGamePayload>;

/** POST /api/admin/games — admin only. */
export async function createGame(payload: CreateGamePayload): Promise<Game> {
  return api<Game>("/api/admin/games", { method: "POST", body: payload });
}

/** PATCH /api/admin/games/[id] — admin only. */
export async function updateGame(
  id: string,
  payload: UpdateGamePayload,
): Promise<Game> {
  return api<Game>(`/api/admin/games/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });
}

/** DELETE /api/admin/games/[id] — admin only. */
export async function deleteGame(id: string): Promise<{ ok: true }> {
  return api<{ ok: true }>(`/api/admin/games/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
