/**
 * useStreamHeartbeat — pings POST /api/streams/[id]/heartbeat every 60s
 * while mounted + the stream is live. Backend dedupes on (channelId,
 * viewer-key, minute_bucket) so calling on mount + every 60s is safe.
 *
 * Drives:
 *  - Live viewer count (read-time calc in lib/api/streams.ts)
 *  - Phase 3.7 analytics rollup (nightly aggregation)
 *
 * Silent on failure — heartbeat errors should not surface to user.
 */

import * as React from "react";
import { sendStreamHeartbeat } from "@/lib/api/streams";

const HEARTBEAT_INTERVAL_MS = 60_000;

export function useStreamHeartbeat(
  streamId: string | undefined,
  enabled: boolean,
): void {
  React.useEffect(() => {
    if (!enabled || !streamId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const ping = async () => {
      if (cancelled) return;
      try {
        await sendStreamHeartbeat(streamId);
      } catch {
        /* silent */
      }
    };

    void ping();
    timer = setInterval(ping, HEARTBEAT_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [streamId, enabled]);
}
