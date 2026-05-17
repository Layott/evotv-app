import { api, ApiError } from "./_client";

export type FantasyStatus = "drafting" | "active" | "completed";
export type ScoringSystem = "kills" | "kda" | "objectives";

export interface FantasyLeagueRow {
  id: string;
  name: string;
  description: string;
  gameId: string;
  ownerId: string;
  members: string[];
  maxMembers: number;
  salaryCap: number;
  prizePool: number;
  entryFee: number;
  scoringSystem: ScoringSystem;
  status: FantasyStatus;
  endsAt: string;
  bannerSeed: string;
  createdAt: string;
}

export interface FantasyLeaderboardRow {
  rank: number;
  userId: string;
  handle: string;
  avatarUrl: string;
  totalPoints: number;
  lineupCount: number;
}

export interface ListLeaguesOpts {
  ownerId?: string;
  /** Pass "me" to filter to the caller's joined leagues (requires auth). */
  memberId?: "me" | string;
  status?: FantasyStatus;
  gameId?: string;
}

/** GET /api/fantasy/leagues — list w/ filter. */
export function listLeagues(
  opts: ListLeaguesOpts = {},
): Promise<FantasyLeagueRow[]> {
  return api<FantasyLeagueRow[]>("/api/fantasy/leagues", {
    query: {
      ownerId: opts.ownerId,
      memberId: opts.memberId,
      status: opts.status,
      gameId: opts.gameId,
    },
  });
}

/** GET /api/fantasy/leagues/[id] — null on 404. */
export async function getLeagueById(
  id: string,
): Promise<FantasyLeagueRow | null> {
  try {
    return await api<FantasyLeagueRow>(
      `/api/fantasy/leagues/${encodeURIComponent(id)}`,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** GET /api/fantasy/leagues/[id]/leaderboard */
export function listLeaderboard(
  leagueId: string,
): Promise<FantasyLeaderboardRow[]> {
  return api<FantasyLeaderboardRow[]>(
    `/api/fantasy/leagues/${encodeURIComponent(leagueId)}/leaderboard`,
  );
}
