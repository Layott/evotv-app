import { api, ApiError } from "./_client";

export type DropKind = "cosmetic" | "premium-trial" | "merch-voucher";
export type Rarity = "common" | "rare" | "epic" | "legendary";
export type RedemptionStatus = "pending" | "delivered" | "expired";
export type Tier = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";

export interface Drop {
  id: string;
  name: string;
  kind: DropKind;
  cost: number;
  stock: number;
  imageUrl: string;
  partner: string;
  description: string;
  category: string;
  rarity: Rarity;
  expiresAt: string | null;
}

export interface Redemption {
  id: string;
  userId: string;
  dropId: string;
  dropName: string;
  dropKind: DropKind;
  partner: string;
  imageUrl: string;
  code: string;
  cost: number;
  redeemedAt: string;
  status: RedemptionStatus;
}

export interface XpTierInfo {
  userId: string;
  totalXp: number;
  tier: Tier;
  nextTier: Tier | null;
  pointsIntoTier: number;
  pointsToNextTier: number;
  progressPct: number;
  coinsBalance: number;
}

/** GET /api/rewards?kind=&category= */
export function listDrops(opts: {
  kind?: DropKind;
  category?: string;
} = {}): Promise<Drop[]> {
  return api<Drop[]>("/api/rewards", {
    query: { kind: opts.kind, category: opts.category },
  });
}

/** GET /api/rewards/me — auth required. Returns XP tier + coin balance. */
export function getXpAndTier(_userId?: string): Promise<XpTierInfo> {
  return api<XpTierInfo>("/api/rewards/me");
}

/** GET /api/rewards/me (just the coins). */
export async function getCoinBalance(_userId?: string): Promise<number> {
  const info = await api<XpTierInfo>("/api/rewards/me");
  return info.coinsBalance;
}

/** POST /api/rewards/redeem — auth required. Spend coins on a drop. */
export function redeemDrop(
  dropId: string,
  _userId?: string,
): Promise<Redemption> {
  return api<Redemption>("/api/rewards/redeem", {
    method: "POST",
    body: { dropId },
  });
}

/** GET /api/rewards/redemptions — auth required. User redemption history. */
export function listMyRedemptions(_userId?: string): Promise<Redemption[]> {
  return api<Redemption[]>("/api/rewards/redemptions");
}

/* ── Daily quests ───────────────────────────────────────────────────── */

export interface DailyQuest {
  id: string;
  label: string;
  description: string;
  unit: string;
  target: number;
  rewardCoins: number;
  rewardXp: number;
  progress: number;
  claimed: boolean;
  expiresAt: string;
}

export interface XpEvent {
  id: string;
  userId: string;
  source: string;
  points: number;
  at: string;
}

export interface QuestClaimResult {
  coinsAwarded: number;
  xpAwarded: number;
  newBalance: number;
  newXp: number;
}

export type QuestClaimErrorCode =
  | "not_found"
  | "incomplete"
  | "already_claimed";

export class QuestClaimError extends Error {
  code: QuestClaimErrorCode;
  constructor(code: QuestClaimErrorCode, msg: string) {
    super(msg);
    this.code = code;
  }
}

/** GET /api/rewards/quests — auth required. Today's daily quests + progress. */
export function listDailyQuests(): Promise<DailyQuest[]> {
  return api<DailyQuest[]>("/api/rewards/quests");
}

/**
 * POST /api/rewards/quests/{id}/claim — claim a completed daily quest. Throws
 * `QuestClaimError` for incomplete / already-claimed / unknown-quest cases so
 * call sites can show a precise toast.
 */
export async function claimDailyQuest(
  questId: string,
): Promise<QuestClaimResult> {
  try {
    return await api<QuestClaimResult>(
      `/api/rewards/quests/${encodeURIComponent(questId)}/claim`,
      { method: "POST" },
    );
  } catch (err) {
    if (err instanceof ApiError) {
      const body = err.body as { error?: string } | null;
      const code = body?.error;
      if (code === "not_found" || code === "incomplete" || code === "already_claimed") {
        throw new QuestClaimError(code, err.message);
      }
    }
    throw err;
  }
}

/** GET /api/rewards/xp-events?limit=20 — recent XP grants. */
export function listRecentXpEvents(limit = 20): Promise<XpEvent[]> {
  return api<XpEvent[]>("/api/rewards/xp-events", {
    query: { limit },
  });
}
