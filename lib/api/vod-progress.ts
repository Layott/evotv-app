import { api } from "./_client";

export interface VodProgress {
  vodId: string;
  positionSec: number;
  updatedAt: string | null;
}

/** GET /api/vod-progress/[vodId] — auth required. Returns null if the user
 *  has never watched this VOD. */
export function getProgress(vodId: string): Promise<VodProgress | null> {
  return api<VodProgress | null>(
    `/api/vod-progress/${encodeURIComponent(vodId)}`,
  );
}

/** POST /api/vod-progress/[vodId] — auth required. */
export function upsertProgress(
  vodId: string,
  positionSec: number,
): Promise<{ ok: true }> {
  return api(`/api/vod-progress/${encodeURIComponent(vodId)}`, {
    method: "POST",
    body: { positionSec },
  });
}
