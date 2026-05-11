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
