/**
 * usePartyChat — native variant. EventSource via react-native-sse.
 *
 * Boots with REST history then opens SSE for live deltas.
 * Reconnects on close with exponential backoff capped at 30s.
 * Mirrors hooks/useStreamChat.ts patterns.
 */

import * as React from "react";
import EventSource from "react-native-sse";

import {
  listPartyMessages,
  sendPartyMessage,
  type PartyChatMessage,
} from "@/lib/api/watch-parties";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3060";
const MAX_BACKOFF_MS = 30_000;
const MAX_MESSAGES = 200;

type PartySseEnvelope =
  | { type: "hello"; partyId: string }
  | { type: "message"; message: PartyChatMessage }
  // sync/presence/ended events flow through the same SSE; we ignore them here.
  | { type: string; [k: string]: unknown };

function handleSseEvent(
  raw: string,
  setMessages: React.Dispatch<React.SetStateAction<PartyChatMessage[]>>,
): void {
  let payload: PartySseEnvelope;
  try {
    payload = JSON.parse(raw) as PartySseEnvelope;
  } catch {
    return;
  }
  if (payload.type !== "message") return;
  const msg = (payload as { message: PartyChatMessage }).message;
  setMessages((prev) => {
    if (prev.some((m) => m.id === msg.id)) return prev;
    const next = [...prev, msg];
    return next.length > MAX_MESSAGES
      ? next.slice(next.length - MAX_MESSAGES)
      : next;
  });
}

export interface UsePartyChatResult {
  messages: PartyChatMessage[];
  send: (body: string) => Promise<void>;
  status: "connecting" | "open" | "closed" | "error";
  error: string | null;
}

export function usePartyChat(
  partyId: string,
  enabled: boolean,
): UsePartyChatResult {
  const [messages, setMessages] = React.useState<PartyChatMessage[]>([]);
  const [status, setStatus] = React.useState<UsePartyChatResult["status"]>("closed");
  const [error, setError] = React.useState<string | null>(null);
  const sourceRef = React.useRef<EventSource | null>(null);

  React.useEffect(() => {
    if (!enabled || !partyId) return;
    let cancelled = false;
    let backoff = 1000;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    void (async () => {
      try {
        const initial = await listPartyMessages(partyId);
        if (!cancelled) setMessages(initial);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load chat");
      }
    })();

    const connect = () => {
      const url = `${BASE_URL}/api/sse/party/${partyId}`;
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
  }, [partyId, enabled]);

  const send = React.useCallback(
    async (body: string) => {
      const trimmed = body.trim();
      if (!trimmed) return;
      try {
        const sent = await sendPartyMessage(partyId, trimmed);
        setMessages((prev) =>
          prev.some((m) => m.id === sent.id) ? prev : [...prev, sent],
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Send failed");
        throw err;
      }
    },
    [partyId],
  );

  return { messages, send, status, error };
}
