/**
 * Where a chat message lives.
 *
 * Chat only ever existed under a live broadcast, so the moment a stream became
 * a recording every word said about it left the screen and the VOD page showed
 * "Comments are coming soon". The backend now serves both from one table with
 * one set of rules, one ban list and one moderation queue, and this is the seam
 * that lets the app talk to either without a second chat implementation.
 *
 * Mirrors `backend/lib/api/chat-target.ts` deliberately. The two repos are not
 * coupled by a package; keeping the shape identical is what makes the swap one
 * line per call site.
 */
export type ChatTarget =
  | { kind: "stream"; id: string }
  | { kind: "vod"; id: string };

/** A bare stream id still works: every existing caller passes one. */
export function toChatTarget(target: ChatTarget | string): ChatTarget {
  return typeof target === "string" ? { kind: "stream", id: target } : target;
}

/** The REST collection for a target. */
export function chatPath(target: ChatTarget): string {
  return target.kind === "vod"
    ? `/api/vods/${target.id}/chat`
    : `/api/streams/${target.id}/chat`;
}

/** The live feed for a target. */
export function chatSsePath(target: ChatTarget): string {
  return target.kind === "vod"
    ? `/api/sse/vod-chat/${target.id}`
    : `/api/sse/chat/${target.id}`;
}
