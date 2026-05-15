import { api } from "./_client";
import type { Ad, AdPlacement } from "@/lib/types";

/** POST /api/ads/impression — increments impression count. */
export function recordAdImpression(adId: string): Promise<{ ok: true }> {
  return api<{ ok: true }>("/api/ads/impression", {
    method: "POST",
    body: { adId },
  });
}

/** POST /api/ads/click — returns the click-through URL. */
export function recordAdClick(adId: string): Promise<{ clickUrl: string }> {
  return api<{ clickUrl: string }>("/api/ads/click", {
    method: "POST",
    body: { adId },
  });
}

export interface ListAdsOptions {
  placement?: AdPlacement;
  active?: boolean;
  limit?: number;
  offset?: number;
}

export interface ListAdsResult {
  ads: Ad[];
  total: number;
  limit: number;
  offset: number;
}

/** GET /api/admin/ads — admin only. Paginated, optional placement+active filter. */
export async function listAdminAds(
  opts: ListAdsOptions = {},
): Promise<ListAdsResult> {
  const q = new URLSearchParams();
  if (opts.placement) q.set("placement", opts.placement);
  if (typeof opts.active === "boolean") q.set("active", String(opts.active));
  if (opts.limit) q.set("limit", String(opts.limit));
  if (opts.offset) q.set("offset", String(opts.offset));
  const qs = q.toString();
  return api<ListAdsResult>(`/api/admin/ads${qs ? `?${qs}` : ""}`);
}

export type CreateAdPayload = Omit<Ad, "id" | "impressions" | "clicks">;

/** POST /api/admin/ads — admin only. */
export async function createAd(payload: CreateAdPayload): Promise<Ad> {
  return api<Ad>("/api/admin/ads", { method: "POST", body: payload });
}

export type UpdateAdPayload = Partial<CreateAdPayload>;

/** PATCH /api/admin/ads/[id] — admin only. */
export async function updateAd(id: string, payload: UpdateAdPayload): Promise<Ad> {
  return api<Ad>(`/api/admin/ads/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });
}

/** DELETE /api/admin/ads/[id] — admin only. */
export async function deleteAd(id: string): Promise<{ ok: true }> {
  return api<{ ok: true }>(`/api/admin/ads/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
