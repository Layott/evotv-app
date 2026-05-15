import { api } from "./_client";

export interface AdminChannelRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  logoUrl: string;
  category: "esports" | "gaming" | "news" | "sports" | "creator";
  isVerified: boolean;
  isEvotvOwned: boolean;
  followerCount: number;
  publisherId: string;
  publisherName: string;
  suspendedAt: string | null;
  suspendedReason: string | null;
  createdAt: string;
}

export interface ListAdminChannelsOpts {
  suspended?: "only" | "include";
  limit?: number;
  offset?: number;
}

export function listAdminChannels(opts: ListAdminChannelsOpts = {}): Promise<{
  channels: AdminChannelRow[];
  total: number;
  limit: number;
  offset: number;
}> {
  return api(`/api/admin/channels`, {
    query: { suspended: opts.suspended, limit: opts.limit, offset: opts.offset },
  });
}

export function suspendChannel(
  id: string,
  reason: string,
): Promise<{
  ok: true;
  channelId: string;
  suspendedAt: string;
  kickedStreams: number;
}> {
  return api(`/api/admin/channels/${encodeURIComponent(id)}/suspend`, {
    method: "POST",
    body: { reason },
  });
}

export function unsuspendChannel(
  id: string,
): Promise<{ ok: true; channelId: string }> {
  return api(`/api/admin/channels/${encodeURIComponent(id)}/suspend`, {
    method: "DELETE",
  });
}
