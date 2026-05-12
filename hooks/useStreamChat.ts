/**
 * useStreamChat — native variant. Uses react-native-sse for EventSource on RN.
 *
 * Bootstraps with REST history then opens SSE for live deltas.
 * Reconnects on close with exponential backoff capped at 30s.
 */

import * as React from "react";
import EventSource from "react-native-sse";

import { listInitialMessages, sendMessage as apiSendMessage, ChatPostError } from "@/lib/api/chat";
import type { ChatMessage } from "@/lib/types";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3060";
const MAX_BACKOFF_MS = 30_000;
const MAX_MESSAGES = 200;

type SseEnvelope =
  | { type: "hello"; streamId: string }
  | { type: "message"; message: ChatMessage }
  | { type: "deleted"; messageId: string }
  | { type: "pinned"; messageId: string; isPinned: boolean };

function handleSseEvent(
  raw: string,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
): void {
  let payload: SseEnvelope;
  try {
    payload = JSON.parse(raw) as SseEnvelope;
  } catch {
    return;
  }
  switch (payload.type) {
    case "hello":
      return;
    case "message":
      setMessages((prev) => {
        if (prev.some((m) => m.id === payload.message.id)) return prev;
        const next = [...prev, payload.message];
        return next.length > MAX_MESSAGES
          ? next.slice(next.length - MAX_MESSAGES)
          : next;
      });
      return;
    case "deleted":
      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.messageId ? { ...m, isDeleted: true } : m,
        ),
      );
      return;
    case "pinned":
      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.messageId
            ? { ...m, isPinned: payload.isPinned }
            : m,
        ),
      );
      return;
  }
}

export interface UseStreamChatResult {
  messages: ChatMessage[];
  send: (body: string) => Promise<void>;
  status: "connecting" | "open" | "closed" | "error";
  error: string | null;
}

export function useStreamChat(streamId: string): UseStreamChatResult {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [status, setStatus] = React.useState<UseStreamChatResult["status"]>("connecting");
  const [error, setError] = React.useState<string | null>(null);
  const sourceRef = React.useRef<EventSource | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    let backoff = 1000;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    void (async () => {
      try {
        const initial = await listInitialMessages(streamId);
        if (!cancelled) setMessages(initial);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load chat");
      }
    })();

    const connect = () => {
      const url = `${BASE_URL}/api/sse/chat/${streamId}`;
      const es = new EventSource(url);
      sourceRef.current = es;
      setStatus("connecting");

      es.addEventListener("open", () => {
        if (cancelled) return;
        backoff = 1000;
        setStatus("open");
      });

      es.addEventListener("message", (event) => {
        if (cancelled) return;
        const data = (event as { data?: string }).data;
        if (!data) return;
        handleSseEvent(data, setMessages);
      });

      es.addEventListener("error", () => {
        if (cancelled) return;
        setStatus("error");
        es.close();
        reconnectTimer = setTimeout(connect, backoff);
        backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
      });
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      sourceRef.current?.close();
      sourceRef.current = null;
      setStatus("closed");
    };
  }, [streamId]);

  const send = React.useCallback(
    async (body: string) => {
      const trimmed = body.trim();
      if (!trimmed) return;
      try {
        const optimistic: ChatMessage = {
          id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          streamId,
          userId: "self",
          userHandle: "you",
          userAvatarUrl: "",
          userRole: "user",
          body: trimmed,
          createdAt: new Date().toISOString(),
          isDeleted: false,
          isPinned: false,
        };
        setMessages((prev) => [...prev, optimistic]);
        const sent = await apiSendMessage(streamId, trimmed);
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? sent : m)),
        );
      } catch (err) {
        if (err instanceof ChatPostError) {
          setError(err.message);
          setMessages((prev) => prev.filter((m) => !m.id.startsWith("local_")));
          throw err;
        }
        throw err;
      }
    },
    [streamId],
  );

  return { messages, send, status, error };
}
