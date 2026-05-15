/**
 * Watch-parties API client — backed by /api/parties/* (Phase 7.1).
 *
 * Shape difference vs lib/mock/watch-parties.ts:
 *  - Backend uses isPrivate:boolean + inviteCode, mock used visibility:"public"|"invite"
 *  - Backend doesn't track language or topic — those mock fields are dropped on flip
 *  - Backend lists 50 most-recent active parties (endedAt is null)
 */

import { api } from "./_client";

export interface PartyListItem {
  id: string;
  name: string;
  hostUserId: string;
  hostName: string | null;
  hostHandle: string | null;
  hostAvatarUrl: string | null;
  streamId: string | null;
  streamTitle: string | null;
  streamThumbnailUrl: string | null;
  maxMembers: number;
  isPrivate: boolean;
  inviteCode: string | null;
  startedAt: string;
  activeMembers: number;
}

export interface PartyMemberRow {
  userId: string;
  name: string | null;
  handle: string | null;
  avatarUrl: string | null;
  joinedAt: string;
  isHost: boolean;
}

export interface PartyDetail extends PartyListItem {
  endedAt: string | null;
  host: {
    id: string;
    name: string;
    handle: string | null;
    image: string | null;
  } | null;
  stream: {
    id: string;
    title: string;
    thumbnailUrl: string;
    streamerName: string;
  } | null;
  members: PartyMemberRow[];
}

export async function listWatchParties(): Promise<PartyListItem[]> {
  return api<PartyListItem[]>("/api/parties");
}

export async function getWatchParty(id: string): Promise<PartyDetail> {
  return api<PartyDetail>(`/api/parties/${encodeURIComponent(id)}`);
}

export interface CreatePartyPayload {
  name: string;
  streamId?: string;
  maxMembers?: number;
  isPrivate?: boolean;
}

export interface CreatePartyResult {
  id: string;
  inviteCode: string | null;
}

export async function createWatchParty(
  payload: CreatePartyPayload,
): Promise<CreatePartyResult> {
  return api<CreatePartyResult>("/api/parties", {
    method: "POST",
    body: payload,
  });
}

export async function joinWatchParty(
  partyId: string,
  inviteCode?: string,
): Promise<{ ok: true; activeMembers: number }> {
  return api(`/api/parties/${encodeURIComponent(partyId)}/join`, {
    method: "POST",
    body: inviteCode ? { inviteCode } : {},
  });
}

export async function leaveWatchParty(
  partyId: string,
): Promise<{ ok: true }> {
  return api(`/api/parties/${encodeURIComponent(partyId)}/leave`, {
    method: "POST",
  });
}

export async function endWatchParty(partyId: string): Promise<{ ok: true }> {
  return api(`/api/parties/${encodeURIComponent(partyId)}`, {
    method: "DELETE",
  });
}

export interface PartySyncPayload {
  type: "play" | "pause" | "seek";
  positionMs?: number;
}

/** Host-only. Broadcasts a play/pause/seek event via SSE. */
export async function syncWatchParty(
  partyId: string,
  payload: PartySyncPayload,
): Promise<{ ok: true }> {
  return api(`/api/parties/${encodeURIComponent(partyId)}/sync`, {
    method: "POST",
    body: payload,
  });
}

export interface PartyChatMessage {
  id: string;
  partyId: string;
  userId: string;
  body: string;
  isSystem: boolean;
  createdAt: string;
  userName: string | null;
  userHandle: string | null;
  userAvatarUrl: string | null;
}

/** GET /api/parties/[id]/messages — last 100, oldest→newest. Requires membership. */
export async function listPartyMessages(
  partyId: string,
): Promise<PartyChatMessage[]> {
  return api<PartyChatMessage[]>(
    `/api/parties/${encodeURIComponent(partyId)}/messages`,
  );
}

/** POST /api/parties/[id]/messages — append + broadcast via SSE. */
export async function sendPartyMessage(
  partyId: string,
  body: string,
): Promise<PartyChatMessage> {
  return api<PartyChatMessage>(
    `/api/parties/${encodeURIComponent(partyId)}/messages`,
    { method: "POST", body: { body } },
  );
}
