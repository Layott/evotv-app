import { api } from "./_client";

export type FollowTarget = "team" | "player" | "streamer";

export interface Follow {
  userId: string;
  targetType: FollowTarget;
  targetId: string;
  createdAt: string;
}

/** GET /api/follows — current user's follows. Backend wraps in
 *  `{ follows: Follow[] }` so unwrap on the client. */
export async function listMyFollows(): Promise<Follow[]> {
  const res = await api<{ follows: Follow[] }>("/api/follows");
  return res.follows ?? [];
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

/**
 * POST /api/follows — toggle helper that mirrors backend's actual response
 * shape `{ following: boolean }`. Returns the *new* follow state.
 */
export function toggleFollow(
  targetType: FollowTarget,
  targetId: string,
): Promise<boolean> {
  return api<{ following: boolean }>("/api/follows", {
    method: "POST",
    body: { targetType, targetId },
  }).then((r) => r.following);
}
