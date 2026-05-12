/**
 * Chat API — backed by /api/streams/[id]/chat (REST) + /api/sse/chat/[streamId] (SSE).
 *
 * Wire shape:
 *   - listInitialMessages(streamId)  GET  /api/streams/:id/chat → { messages: ChatMessage[] }
 *   - sendMessage(streamId, body)    POST /api/streams/:id/chat → ChatMessage
 *
 * Realtime delivery lives in hooks/useStreamChat.ts via SSE.
 * Moderation tools (pin/delete/ban) live on lib/mock/chat until the partner
 * dashboard ships in Phase 3.
 */

import { api, ApiError } from "./_client";
import type { ChatMessage } from "@/lib/types";
import {
  pinMessage as mockPinMessage,
  deleteMessage as mockDeleteMessage,
  banUser as mockBanUser,
  isUserBanned as mockIsUserBanned,
  getModerationLog as mockGetModerationLog,
} from "@/lib/mock/chat";

interface ListResponse {
  messages: ChatMessage[];
}

export async function listInitialMessages(
  streamId: string,
): Promise<ChatMessage[]> {
  try {
    const res = await api<ListResponse>(`/api/streams/${streamId}/chat`);
    return res.messages;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
}

export class ChatPostError extends Error {
  status: number;
  code: "auth_required" | "stream_not_found" | "rate_limited" | "banned_word" | "invalid_body" | "unknown";
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
  streamId: string,
  body: string,
): Promise<ChatMessage> {
  try {
    const res = await api<SendResponse>(`/api/streams/${streamId}/chat`, {
      method: "POST",
      body: { body },
    });
    return res.message;
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401)
        throw new ChatPostError(401, "auth_required", "Sign in to chat");
      if (err.status === 404)
        throw new ChatPostError(404, "stream_not_found", "Stream not found");
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

// Moderation passes through to mock until partner dashboard ships.
export const pinMessage = mockPinMessage;
export const deleteMessage = mockDeleteMessage;
export const banUser = mockBanUser;
export const isUserBanned = mockIsUserBanned;
export const getModerationLog = mockGetModerationLog;
