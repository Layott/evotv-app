import { api } from "./_client";

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
