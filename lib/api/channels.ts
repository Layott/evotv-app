import { api } from "./_client";

export interface ChannelPublic {
  id: string;
  publisherId: string;
  slug: string;
  name: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  brandColor: string;
  category: string;
  isVerified: boolean;
  isEvotvOwned: boolean;
  followerCount: number;
  createdAt: string;
}

export interface ChannelLiveStream {
  id: string;
  title: string;
  hlsPath: string;
  thumbnailUrl: string;
  startedAt: string | null;
  viewerCount: number;
}

export interface ChannelVod {
  id: string;
  title: string;
  durationSec: number;
  thumbnailUrl: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
}

export interface ChannelPageData {
  channel: ChannelPublic;
  liveStream: ChannelLiveStream | null;
  recentVods: ChannelVod[];
  followedByMe: boolean;
}

export async function getChannelPage(slug: string): Promise<ChannelPageData> {
  return api<ChannelPageData>(`/api/channels/${encodeURIComponent(slug)}`);
}

export async function toggleChannelFollow(
  slug: string,
): Promise<{ following: boolean }> {
  return api<{ following: boolean }>(
    `/api/channels/${encodeURIComponent(slug)}/follow`,
    { method: "POST" },
  );
}
