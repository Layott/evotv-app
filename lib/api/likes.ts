import { api } from "./_client";

export type LikeTarget = "vod" | "clip";

export interface ToggleLikeResult {
  liked: boolean;
  count: number;
}

/** POST /api/likes — auth required. Toggles like on a vod or clip. */
export function toggleLike(
  targetType: LikeTarget,
  targetId: string,
): Promise<ToggleLikeResult> {
  return api<ToggleLikeResult>("/api/likes", {
    method: "POST",
    body: { targetType, targetId },
  });
}
