import { api } from "./_client";

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
