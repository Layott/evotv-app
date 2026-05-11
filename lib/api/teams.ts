import type { Team } from "@/lib/types";
import { api } from "./_client";

/** GET /api/teams?gameId= */
export function listTeams(filter: { gameId?: string } = {}): Promise<Team[]> {
  return api<Team[]>("/api/teams", { query: { gameId: filter.gameId } });
}

/** GET /api/teams/[id] */
export function getTeamById(id: string): Promise<Team | null> {
  return api<Team | null>(`/api/teams/${id}`);
}

/** GET /api/teams?slug= */
export function getTeamBySlug(slug: string): Promise<Team | null> {
  return api<Team | null>("/api/teams", { query: { slug } });
}
