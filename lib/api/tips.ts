/**
 * Tips API — wraps backend /api/tips routes.
 *
 * Phase 2A scope:
 *  - getCoinBalance + sendTip hit real backend.
 *  - listSentTips / listReceivedTips / topTippers fall back to lib/mock/tips
 *    until Phase 3 (multi-tenant streaming) introduces channels with real
 *    user-bound owners. Backend has no listing routes today.
 *  - SAMPLE_STREAMERS stays on mock for the UI streamer picker. Phase 3 will
 *    replace with real channel rows.
 *  - Streamer handle → backend userId resolution: hardcoded map for now,
 *    falls back to a seeded admin user. Replace with channel/publisher
 *    lookup in Phase 3.
 */

import { api, ApiError } from "./_client";
import {
  listSentTips as mockListSentTips,
  listReceivedTips as mockListReceivedTips,
  listAllReceivedForCurrentCreator as mockListAllReceivedForCreator,
  topTippers as mockTopTippers,
  SAMPLE_STREAMERS,
  type Tip,
  type TopTipper,
} from "@/lib/mock/tips";

export { SAMPLE_STREAMERS };
export type { Tip, TopTipper };

interface BackendTip {
  id: string;
  fromUserId: string;
  toUserId: string;
  streamId: string | null;
  coins: number;
  message: string;
  at: string;
}

interface BalanceResponse {
  coins: number;
}

/**
 * Phase 2A stopgap: backend `tips.toUserId` references a real `user.id`,
 * but mock streamers use handles only. Until Phase 3 binds channels to
 * publisher-owning users, route every demo tip to the seeded admin user.
 * Replace with `GET /api/channels/<slug>` lookup in Phase 3.
 */
const FALLBACK_RECIPIENT_USER_ID = "user_admin";
const HANDLE_TO_USER_ID: Record<string, string> = {
  evo_tv_official: FALLBACK_RECIPIENT_USER_ID,
  evo_tv_channel: FALLBACK_RECIPIENT_USER_ID,
};

function resolveRecipient(streamerHandle: string): string {
  return HANDLE_TO_USER_ID[streamerHandle] ?? FALLBACK_RECIPIENT_USER_ID;
}

export async function getCoinBalance(_userId: string): Promise<number> {
  try {
    const res = await api<BalanceResponse>("/api/tips/balance");
    return res.coins;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return 0;
    throw err;
  }
}

interface SendTipResult {
  success: boolean;
  tip?: Tip;
  reason?: string;
  balance?: number;
}

export async function sendTip(
  streamerHandle: string,
  streamId: string | null,
  amountCoins: number,
  message: string,
  options?: {
    fromUserId?: string;
    fromHandle?: string;
    fromAvatarUrl?: string;
    toStreamerName?: string;
    toStreamerAvatarUrl?: string;
    streamTitle?: string | null;
  },
): Promise<SendTipResult> {
  if (!streamerHandle) return { success: false, reason: "Missing streamer" };
  if (!Number.isFinite(amountCoins) || amountCoins <= 0) {
    return { success: false, reason: "Invalid amount" };
  }

  const toUserId = resolveRecipient(streamerHandle);

  try {
    const backendTip = await api<BackendTip>("/api/tips", {
      method: "POST",
      body: {
        toUserId,
        coins: amountCoins,
        message: message?.slice(0, 280) || undefined,
        streamId: streamId ?? undefined,
      },
    });

    const inferredStreamer = SAMPLE_STREAMERS.find(
      (s) => s.handle === streamerHandle,
    );

    const tip: Tip = {
      id: backendTip.id,
      fromUserId: backendTip.fromUserId,
      fromHandle: options?.fromHandle ?? "you",
      fromAvatarUrl: options?.fromAvatarUrl ?? "",
      toStreamerHandle: streamerHandle,
      toStreamerName:
        options?.toStreamerName ?? inferredStreamer?.name ?? streamerHandle,
      toStreamerAvatarUrl:
        options?.toStreamerAvatarUrl ?? inferredStreamer?.avatar ?? "",
      streamId: backendTip.streamId,
      streamTitle: options?.streamTitle ?? null,
      amountCoins: backendTip.coins,
      message: backendTip.message,
      atIso: backendTip.at,
    };

    const newBalance = await getCoinBalance(backendTip.fromUserId);
    return { success: true, tip, balance: newBalance };
  } catch (err) {
    if (err instanceof ApiError) {
      const body = err.body as { error?: string; code?: string } | null;
      const reason =
        body?.error ??
        (err.status === 401
          ? "Sign in to tip"
          : err.status === 402
            ? "Not enough EVO Coins"
            : err.status === 404
              ? "Recipient not on platform yet"
              : "Tip failed");
      const balance =
        err.status === 402
          ? await getCoinBalance("self").catch(() => undefined)
          : undefined;
      return { success: false, reason, balance };
    }
    throw err;
  }
}

// Listing fns still mock-backed until Phase 3 (multi-tenant) adds channel
// queries. Pass-through so the screen import stays single-source.

export async function listSentTips(userId: string): Promise<Tip[]> {
  return mockListSentTips(userId);
}

export async function listReceivedTips(streamerHandle: string): Promise<Tip[]> {
  return mockListReceivedTips(streamerHandle);
}

export async function listAllReceivedForCurrentCreator(): Promise<Tip[]> {
  return mockListAllReceivedForCreator();
}

export async function topTippers(limit = 10): Promise<TopTipper[]> {
  return mockTopTippers(limit);
}
