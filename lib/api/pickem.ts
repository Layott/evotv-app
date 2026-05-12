/**
 * Pickem API — wraps backend /api/pickem routes.
 *
 * Phase 6 scope:
 *   - submitPickemEntry → POST /api/pickem/[eventId] (upsert; 409 if locked)
 *   - getMyEntryForEvent → GET /api/pickem/[eventId]
 *   - listLeagueLeaderboardForEvent → GET /api/pickem/[eventId]/leaderboard
 *   - buildBracket, deriveBracketWithPicks, listMyEntries, getEntry,
 *     listEntriesForEvent, getBracketForEvent → pass-through to mock.
 *     The bracket builder is event-data derivation, not a backend
 *     responsibility yet (event match data is on backend; bracket layout
 *     is a client-side computation).
 */

import { api, ApiError } from "./_client";
import {
  buildBracket as mockBuildBracket,
  getBracketForEvent as mockGetBracketForEvent,
  deriveBracketWithPicks as mockDeriveBracketWithPicks,
  listMyEntries as mockListMyEntries,
  getEntry as mockGetEntry,
  listEntriesForEvent as mockListEntriesForEvent,
  type BracketMatch,
  type BracketPick,
  type PickemEntry,
  type PickemLeaderboardEntry,
  type PickemRound,
} from "@/lib/mock/pickem";

export {
  type BracketMatch,
  type BracketPick,
  type PickemEntry,
  type PickemLeaderboardEntry,
  type PickemRound,
};

interface BackendEntry {
  eventId: string;
  userId: string;
  picks: BracketPick[];
  score: number;
  submittedAt: string;
}

interface BackendLeaderboardRow {
  rank: number;
  userId: string;
  handle: string;
  avatarUrl: string;
  score: number;
}

interface SubmitResult {
  ok: boolean;
  entry: PickemEntry;
  error: string;
}

export async function submitPickemEntry(
  eventId: string,
  picks: BracketPick[],
  userId: string,
): Promise<SubmitResult> {
  const optimistic: PickemEntry = {
    id: `${eventId}:${userId}`,
    eventId,
    userId,
    picks,
    score: 0,
    submittedAt: new Date().toISOString(),
  };
  try {
    await api(`/api/pickem/${encodeURIComponent(eventId)}`, {
      method: "POST",
      body: { picks },
    });
    return { ok: true, entry: optimistic, error: "" };
  } catch (err) {
    let reason = "Submit failed";
    if (err instanceof ApiError) {
      reason =
        err.status === 409
          ? "Bracket locked — picks closed"
          : err.status === 401
            ? "Sign in to submit picks"
            : err.status === 404
              ? "Event not found"
              : "Submit failed";
    } else {
      reason = "Network error";
    }
    return { ok: false, entry: optimistic, error: reason };
  }
}

export async function getMyEntryForEvent(
  eventId: string,
  _userId?: string,
): Promise<PickemEntry | null> {
  try {
    const row = await api<BackendEntry>(
      `/api/pickem/${encodeURIComponent(eventId)}`,
    );
    return {
      id: `${row.eventId}:${row.userId}`,
      eventId: row.eventId,
      userId: row.userId,
      picks: row.picks,
      score: row.score,
      submittedAt: row.submittedAt,
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export async function listLeagueLeaderboardForEvent(
  eventId: string,
): Promise<PickemLeaderboardEntry[]> {
  try {
    const rows = await api<BackendLeaderboardRow[]>(
      `/api/pickem/${encodeURIComponent(eventId)}/leaderboard`,
    );
    return rows.map((r) => ({
      rank: r.rank,
      userId: r.userId,
      handle: r.handle,
      avatarUrl: r.avatarUrl,
      score: r.score,
      // Backend doesn't expose per-row pick counts yet; stub until added.
      correctPicks: 0,
      totalPicks: 0,
    }));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
}

// Helpers below remain on mock — backend has no equivalents yet.
export const buildBracket = mockBuildBracket;
export const getBracketForEvent = mockGetBracketForEvent;
export const deriveBracketWithPicks = mockDeriveBracketWithPicks;
export const listMyEntries = mockListMyEntries;
export const getEntry = mockGetEntry;
export const listEntriesForEvent = mockListEntriesForEvent;
