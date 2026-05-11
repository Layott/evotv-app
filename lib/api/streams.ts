import type { Stream } from "@/lib/types";
import { api } from "./_client";

export interface ListStreamsOpts {
  gameId?: string;
  isPremium?: boolean;
}

/** GET /api/streams?gameId=&isPremium=  — live streams */
export function listLiveStreams(opts: ListStreamsOpts = {}): Promise<Stream[]> {
  return api<Stream[]>("/api/streams", {
    query: { gameId: opts.gameId, isPremium: opts.isPremium },
  });
}

/** GET /api/streams?featured=1 */
export function listFeaturedStreams(): Promise<Stream[]> {
  return api<Stream[]>("/api/streams", { query: { featured: "1" } });
}

/** GET /api/streams/[id] */
export function getStreamById(id: string): Promise<Stream | null> {
  return api<Stream | null>(`/api/streams/${id}`);
}

/** Convenience: the main 24/7 channel stream. */
export function getMainChannel(): Promise<Stream | null> {
  return api<Stream | null>("/api/streams/channel_main");
}
