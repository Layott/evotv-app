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

export interface CreateLeaguePayload {
  name: string;
  description?: string;
  gameId: string;
  maxMembers?: number;
  salaryCap: number;
  prizePool?: number;
  entryFee?: number;
  scoringSystem: ScoringSystem;
  endsAt: string;
  bannerSeed?: string;
}

/** POST /api/fantasy/leagues — create. Owner auto-joins. */
export function createLeague(
  payload: CreateLeaguePayload,
): Promise<FantasyLeagueRow> {
  return api<FantasyLeagueRow>("/api/fantasy/leagues", {
    method: "POST",
    body: payload,
  });
}

/** POST /api/fantasy/leagues/[id]/join. 404 / 409 (full / already member). */
export function joinLeague(leagueId: string): Promise<{ ok: true }> {
  return api(`/api/fantasy/leagues/${encodeURIComponent(leagueId)}/join`, {
    method: "POST",
    body: {},
  });
}

export interface LineupPickPayload {
  playerId: string;
  cost: number;
}

export interface LineupRow {
  id: string;
  leagueId: string;
  userId: string;
  totalCost: number;
  totalPoints: number;
  submittedAt: string;
  picks: Array<{ playerId: string; cost: number; pointsScored: number }>;
}

/** GET /api/fantasy/leagues/[id]/lineup — caller's lineup (null if none). */
export function getLineup(leagueId: string): Promise<LineupRow | null> {
  return api<LineupRow | null>(
    `/api/fantasy/leagues/${encodeURIComponent(leagueId)}/lineup`,
  );
}

/** POST /api/fantasy/leagues/[id]/lineup — upsert. */
export function submitLineup(
  leagueId: string,
  picks: LineupPickPayload[],
): Promise<LineupRow> {
  return api<LineupRow>(
    `/api/fantasy/leagues/${encodeURIComponent(leagueId)}/lineup`,
    {
      method: "POST",
      body: { picks },
    },
  );
}

export interface ActivityRow {
  id: string;
  leagueId: string;
  kind: "join" | "lineup" | "score";
  message: string;
  createdAt: string;
}

/** GET /api/fantasy/leagues/[id]/activity */
export function listActivity(
  leagueId: string,
  limit = 20,
): Promise<ActivityRow[]> {
  return api<ActivityRow[]>(
    `/api/fantasy/leagues/${encodeURIComponent(leagueId)}/activity`,
    { query: { limit } },
  );
}
