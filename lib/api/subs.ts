import type { Subscription } from "@/lib/types";
import { api } from "./_client";

export type TierId = "free" | "supporter" | "premium" | "pro";

export interface Tier {
  id: TierId;
  name: string;
  priceNgn: number;
  periodDays: number;
  features: string[];
  /**
   * One line saying what the plan is for, and the label for its button.
   *
   * `/api/tiers` has returned both for a while; this type just never listed
   * them, so the upgrade screen invented its own from `features[0]` and a
   * price check. The words belong to whoever edits the ladder, not to the
   * screen rendering it.
   */
  tagline: string;
  cta: string;
}

/** GET /api/tiers - public, returns full tier ladder. */
export function listTiers(): Promise<Tier[]> {
  return api<Tier[]>("/api/tiers");
}

/** GET /api/subscriptions/me - auth required. */
export async function getActiveSubscription(
  _userId?: string,
): Promise<Subscription | null> {
  const res = await api<{ subscription: Subscription | null }>(
    "/api/subscriptions/me",
  );
  return res.subscription;
}

/** POST /api/subscriptions/cancel - auth required. */
export function cancelSubscription(_userId?: string): Promise<{ ok: true }> {
  return api<{ ok: true }>("/api/subscriptions/cancel", { method: "POST" });
}
