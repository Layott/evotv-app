import type { Player } from "@/lib/types";
import { api } from "./_client";

export interface ListPlayersOpts {
  teamId?: string;
  gameId?: string;
}

/** GET /api/players?teamId=&gameId= */
export function listPlayers(opts: ListPlayersOpts = {}): Promise<Player[]> {
  return api<Player[]>("/api/players", {
    query: { teamId: opts.teamId, gameId: opts.gameId },
  });
}

/** GET /api/players/[id] */
export function getPlayerById(id: string): Promise<Player | null> {
  return api<Player | null>(`/api/players/${id}`);
}

export type CreatePlayerPayload = Omit<Player, "id">;
export type UpdatePlayerPayload = Partial<CreatePlayerPayload>;

/** POST /api/admin/players — admin only. */
export async function createPlayer(
  payload: CreatePlayerPayload,
): Promise<Player> {
  return api<Player>("/api/admin/players", { method: "POST", body: payload });
}

/** PATCH /api/admin/players/[id] — admin only. */
export async function updatePlayer(
  id: string,
  payload: UpdatePlayerPayload,
): Promise<Player> {
  return api<Player>(`/api/admin/players/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });
}

/** DELETE /api/admin/players/[id] — admin only. */
export async function deletePlayer(id: string): Promise<{ ok: true }> {
  return api<{ ok: true }>(`/api/admin/players/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
