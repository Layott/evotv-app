/**
 * Chat, live and under a recording.
 *
 * Wire shape:
 *   - listInitialMessages(target)      GET  /api/streams/:id/chat
 *                                      GET  /api/vods/:id/chat     → { messages }
 *   - sendMessage(target, body, parentId?)  POST the same paths     → { message }
 *
 * Realtime delivery lives in hooks/useStreamChat.ts via SSE.
 * Moderation tools (pin/delete/ban) live on the backend's own routes; the app
 * has no moderator surface yet outside the partner screen.
 */

import { api, ApiError } from "./_client";
import { chatPath, toChatTarget, type ChatTarget } from "./chat-target";
import type { ChatMessage } from "@/lib/types";

interface ListResponse {
  messages: ChatMessage[];
}

export async function listInitialMessages(
  target: ChatTarget | string,
): Promise<ChatMessage[]> {
  try {
    const res = await api<ListResponse>(chatPath(toChatTarget(target)));
    return res.messages;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
}

export class ChatPostError extends Error {
  status: number;
  code:
    | "auth_required"
    | "stream_not_found"
    | "rate_limited"
    | "banned_word"
    | "invalid_body"
    | "unknown";
  constructor(status: number, code: ChatPostError["code"], message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

interface SendResponse {
  message: ChatMessage;
}

export async function sendMessage(
  target: ChatTarget | string,
  body: string,
  parentId?: string | null,
): Promise<ChatMessage> {
  try {
    const res = await api<SendResponse>(chatPath(toChatTarget(target)), {
      method: "POST",
      body: parentId ? { body, parentId } : { body },
    });
    return res.message;
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401)
        throw new ChatPostError(401, "auth_required", "Sign in to chat");
      if (err.status === 403) {
        const errBody = err.body as { error?: string } | null;
        throw new ChatPostError(
          403,
          "banned_word",
          errBody?.error ?? "You are banned from chat",
        );
      }
      if (err.status === 404)
        throw new ChatPostError(404, "stream_not_found", "Not found");
      if (err.status === 429)
        throw new ChatPostError(
          429,
          "rate_limited",
          "Slow mode: wait a moment before sending again",
        );
      if (err.status === 422) {
        const errBody = err.body as
          | { error?: string; reason?: string }
          | null;
        const msg = errBody?.reason ?? errBody?.error ?? "Message rejected";
        const code = msg.toLowerCase().includes("banned")
          ? "banned_word"
          : "invalid_body";
        throw new ChatPostError(422, code, msg);
      }
    }
    throw new ChatPostError(500, "unknown", "Send failed");
  }
}

/*
 * Moderation used to be re-exported here, pointing at fabricated
 * implementations that pinned and banned inside a local array. Nothing called
 * them, so nobody was misled, but an exported `banUser` on the module a screen
 * already imports is a trap waiting for the first moderator UI. Build it
 * against real endpoints when the partner dashboard ships.
 */
