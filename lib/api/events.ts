import type { EsportsEvent, Match } from "@/lib/types";
import { api } from "./_client";

/**
 * Signatures mirror lib/mock/events.ts so call sites flip with one import swap.
 * Backend route: GET /api/events?status=&gameId=
 */

export interface ListEventsOpts {
  status?: EsportsEvent["status"];
  gameId?: string;
}

export function listEvents(opts: ListEventsOpts = {}): Promise<EsportsEvent[]> {
  return api<EsportsEvent[]>("/api/events", {
    query: { status: opts.status, gameId: opts.gameId },
  });
}

export function getEventById(id: string): Promise<EsportsEvent | null> {
  return api<EsportsEvent | null>(`/api/events/${id}`);
}

export function getEventBySlug(slug: string): Promise<EsportsEvent | null> {
  return api<EsportsEvent | null>(`/api/events`, { query: { slug } });
}

export function listMatchesForEvent(eventId: string): Promise<Match[]> {
  return api<Match[]>(`/api/events/${eventId}/matches`);
}
