/**
 * Partner-scoped API. Backed by /api/partner/* routes.
 *
 * `getMyMemberships` returns publishers the caller belongs to + their
 * channels. Drives the (partner) route group gate.
 */

import { api, ApiError } from "./_client";

export type PublisherRole = "owner" | "admin" | "editor" | "viewer";

export interface PublisherSummary {
  id: string;
  slug: string;
  name: string;
  isEvotvOwned: boolean;
  kycState: string;
  revenueSharePct: number;
}

export interface ChannelSummary {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  category: string;
  isVerified: boolean;
  followerCount: number;
}

export interface PublisherMembership {
  publisher: PublisherSummary;
  role: PublisherRole;
  channels: ChannelSummary[];
}

export async function getMyMemberships(): Promise<PublisherMembership[]> {
  try {
    return await api<PublisherMembership[]>("/api/partner/me");
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return [];
    throw err;
  }
}

export interface ChannelStreamKeyState {
  hasActiveKey: boolean;
  activeKey: {
    id: string;
    createdAt: string;
    rotatedAt: string | null;
  } | null;
}

export async function getChannelKeyState(
  channelId: string,
): Promise<ChannelStreamKeyState> {
  return api<ChannelStreamKeyState>(
    `/api/partner/channels/${encodeURIComponent(channelId)}/key`,
  );
}

export interface RotatedKey {
  streamKey: string;
  id: string;
  createdAt: string;
  notice: string;
}

export async function rotateChannelKey(
  channelId: string,
): Promise<RotatedKey> {
  return api<RotatedKey>(
    `/api/partner/channels/${encodeURIComponent(channelId)}/key`,
    { method: "POST" },
  );
}

export type AnalyticsPeriod = "7d" | "30d" | "90d" | "all";

export interface AnalyticsDailyRow {
  channelId: string;
  date: string;
  views: number;
  uniqueViewers: number;
  watchMinutes: number;
  peakConcurrent: number;
  followersGained: number;
  followersLost: number;
  tipCoinsReceived: number;
  tipCount: number;
  productOrders: number;
  productRevenueNgn: number;
  adImpressions: number;
  adRevenueNgn: number;
  updatedAt: string;
}

export interface AnalyticsTotals {
  views: number;
  uniqueViewers: number;
  watchMinutes: number;
  peakConcurrent: number;
  tipCoinsReceived: number;
  tipCount: number;
  followersGained: number;
  followersLost: number;
  productOrders: number;
  productRevenueNgn: number;
}

export interface ChannelAnalytics {
  channelId: string;
  period: AnalyticsPeriod;
  from: string | null;
  to: string | null;
  rows: AnalyticsDailyRow[];
  totals: AnalyticsTotals;
}

export async function getChannelAnalytics(
  channelId: string,
  period: AnalyticsPeriod = "30d",
): Promise<ChannelAnalytics> {
  return api<ChannelAnalytics>(
    `/api/partner/channels/${encodeURIComponent(channelId)}/analytics?period=${period}`,
  );
}
