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

export type CreateTeamPayload = Omit<Team, "id">;
export type UpdateTeamPayload = Partial<CreateTeamPayload>;

/** POST /api/admin/teams — admin only. */
export async function createTeam(payload: CreateTeamPayload): Promise<Team> {
  return api<Team>("/api/admin/teams", { method: "POST", body: payload });
}

/** PATCH /api/admin/teams/[id] — admin only. */
export async function updateTeam(
  id: string,
  payload: UpdateTeamPayload,
): Promise<Team> {
  return api<Team>(`/api/admin/teams/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });
}

/** DELETE /api/admin/teams/[id] — admin only. */
export async function deleteTeam(id: string): Promise<{ ok: true }> {
  return api<{ ok: true }>(`/api/admin/teams/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
