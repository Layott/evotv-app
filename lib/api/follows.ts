import { api } from "./_client";

export type FollowTarget = "team" | "player" | "streamer";

export interface Follow {
  userId: string;
  targetType: FollowTarget;
  targetId: string;
  createdAt: string;
}

/** GET /api/follows — current user's follows */
export function listMyFollows(): Promise<Follow[]> {
  return api<Follow[]>("/api/follows");
}

/** POST /api/follows — body { targetType, targetId } */
export function follow(targetType: FollowTarget, targetId: string): Promise<Follow> {
  return api<Follow>("/api/follows", {
    method: "POST",
    body: { targetType, targetId },
  });
}

/** DELETE /api/follows — body { targetType, targetId } */
export function unfollow(targetType: FollowTarget, targetId: string): Promise<void> {
  return api<void>("/api/follows", {
    method: "DELETE",
    body: { targetType, targetId },
  });
}

/** GET /api/follows/check?type=&id= */
export function isFollowing(targetType: FollowTarget, targetId: string): Promise<boolean> {
  return api<{ following: boolean }>("/api/follows/check", {
    query: { type: targetType, id: targetId },
  }).then((r) => r.following);
}
