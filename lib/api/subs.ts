import type { Subscription } from "@/lib/types";
import { api } from "./_client";

export type TierId = "free" | "supporter" | "premium" | "pro";

export interface Tier {
  id: TierId;
  name: string;
  priceNgn: number;
  periodDays: number;
  features: string[];
}

/** GET /api/tiers — public, returns full tier ladder. */
export function listTiers(): Promise<Tier[]> {
  return api<Tier[]>("/api/tiers");
}

/** GET /api/subscriptions/me — auth required. */
export async function getActiveSubscription(
  _userId?: string,
): Promise<Subscription | null> {
  const res = await api<{ subscription: Subscription | null }>(
    "/api/subscriptions/me",
  );
  return res.subscription;
}

/** POST /api/subscriptions/cancel — auth required. */
export function cancelSubscription(_userId?: string): Promise<{ ok: true }> {
  return api<{ ok: true }>("/api/subscriptions/cancel", { method: "POST" });
}
