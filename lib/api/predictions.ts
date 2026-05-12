/**
 * Predictions API — wraps backend /api/predictions routes.
 *
 * Phase 6 scope:
 *   - submitPrediction → POST /api/predictions/picks (real, atomic debit,
 *     Idempotency-Key)
 *   - listMyPredictions → GET /api/predictions/mine (real)
 *   - listOpenPredictionEvents, listLeaderboard, getCoinBalance,
 *     getTeamOdds, getTeamById → pass-through to lib/mock/predictions
 *     until backend exposes them. coin_balances is already real via
 *     /api/tips/balance but the mock signature returns a different shape.
 *
 * Collision: getCoinBalance + getTeamById name-clash with other modules.
 * Don't re-export from lib/api/index.ts — import direct.
 */

import { api, ApiError } from "./_client";
import {
  listOpenPredictionEvents as mockListOpenEvents,
  listLeaderboard as mockListLeaderboard,
  getCoinBalance as mockGetCoinBalance,
  getTeamOdds as mockGetTeamOdds,
  getTeamById as mockGetTeamById,
  listPredictionsForEvent as mockListForEvent,
  type Prediction,
  type LeaderboardEntry,
  type CoinBalance,
  type PredictionEventSummary,
  type PredictionStatus,
} from "@/lib/mock/predictions";

export {
  type Prediction,
  type LeaderboardEntry,
  type CoinBalance,
  type PredictionEventSummary,
  type PredictionStatus,
};

interface BackendPick {
  id: string;
  userId: string;
  matchId: string;
  teamPickedId: string;
  coinsStaked: number;
  status: PredictionStatus;
  payoutCoins: number;
  createdAt: string;
  resolvedAt: string | null;
}

function idempotencyKey(): string {
  return (
    "idem_" +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).slice(2, 10)
  );
}

interface SubmitResult {
  ok: boolean;
  prediction: Prediction;
  error: string;
}

export async function submitPrediction(
  matchId: string,
  teamPickedId: string,
  coinsStaked: number,
  userId: string,
): Promise<SubmitResult> {
  const optimistic: Prediction = {
    id: "",
    userId,
    matchId,
    teamPickedId,
    coinsStaked,
    status: "open",
    payoutCoins: coinsStaked * 2,
    createdAt: new Date().toISOString(),
  };
  try {
    const res = await api<{ id: string; status: PredictionStatus }>(
      "/api/predictions/picks",
      {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey() },
        body: { matchId, teamPickedId, coinsStaked },
      },
    );
    return {
      ok: true,
      prediction: { ...optimistic, id: res.id, status: res.status },
      error: "",
    };
  } catch (err) {
    let reason = "Prediction failed";
    if (err instanceof ApiError) {
      const body = err.body as { error?: string; code?: string } | null;
      reason =
        body?.error ??
        (err.status === 401
          ? "Sign in to predict"
          : err.status === 402
            ? "Not enough EVO Coins"
            : err.status === 404
              ? "Match not found"
              : err.status === 409
                ? "Already picked"
                : "Prediction failed");
    } else {
      reason = "Network error";
    }
    return { ok: false, prediction: optimistic, error: reason };
  }
}

export async function listMyPredictions(_userId?: string): Promise<Prediction[]> {
  try {
    const rows = await api<BackendPick[]>("/api/predictions/mine");
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      matchId: r.matchId,
      teamPickedId: r.teamPickedId,
      coinsStaked: r.coinsStaked,
      status: r.status,
      payoutCoins: r.payoutCoins,
      createdAt: r.createdAt,
    }));
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return [];
    throw err;
  }
}

// Helper functions backend hasn't covered — proxy to mock for now.
export const listOpenPredictionEvents = mockListOpenEvents;
export const listLeaderboard = mockListLeaderboard;
export const getCoinBalance = mockGetCoinBalance;
export const getTeamOdds = mockGetTeamOdds;
export const getTeamById = mockGetTeamById;
export const listPredictionsForEvent = mockListForEvent;
