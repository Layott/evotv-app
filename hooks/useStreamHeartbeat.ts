/**
 * useStreamHeartbeat — pings POST /api/streams/[id]/heartbeat every 60s
 * while mounted + the stream is live, then fires DELETE on unmount so the
 * read-time viewer count drops immediately instead of decaying for ~90s.
 *
 * Drives:
 *  - Live viewer count (read-time calc in lib/api/streams.ts)
 *  - Phase 3.7 analytics rollup (nightly aggregation)
 *
 * Calls `onFirstAck` once after the first successful heartbeat lands so the
 * caller can invalidate its stream query and surface the bumped count
 * without waiting for the next refetchInterval tick.
 *
 * Silent on failure — heartbeat errors should not surface to user.
 */

import * as React from "react";
import {
  sendStreamHeartbeat,
  stopStreamHeartbeat,
} from "@/lib/api/streams";

const HEARTBEAT_INTERVAL_MS = 60_000;

export function useStreamHeartbeat(
  streamId: string | undefined,
  enabled: boolean,
  onFirstAck?: () => void,
): void {
  // Latch onFirstAck so the effect closure doesn't restart every render
  // when the parent passes a new inline callback.
  const onFirstAckRef = React.useRef(onFirstAck);
  React.useEffect(() => {
    onFirstAckRef.current = onFirstAck;
  }, [onFirstAck]);

  React.useEffect(() => {
    if (!enabled || !streamId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    let firstAcked = false;

    const ping = async () => {
      if (cancelled) return;
      try {
        await sendStreamHeartbeat(streamId);
        if (!firstAcked && !cancelled) {
          firstAcked = true;
          onFirstAckRef.current?.();
        }
      } catch {
        /* silent */
      }
    };

    void ping();
    timer = setInterval(ping, HEARTBEAT_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      // Best-effort drop — backend filters to the last 90s anyway.
      void stopStreamHeartbeat(streamId).catch(() => {});
    };
  }, [streamId, enabled]);
}
