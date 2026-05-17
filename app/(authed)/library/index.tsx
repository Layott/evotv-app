import * as React from "react";
import { Text, View } from "react-native";
import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { TopNavbar } from "@/components/home/top-navbar";
import {
  LibraryTabs,
  type FollowingItem,
} from "@/components/library/library-tabs";
import { useAuth } from "@/components/providers";
import { listTeams } from "@/lib/api/teams";
import { listPlayers } from "@/lib/api/players";
import { getStreamById } from "@/lib/api/streams";
import {
  listMyVodProgress,
  type VodProgressEntry,
} from "@/lib/api/library";
import {
  listWatchLater,
  type WatchLaterEntry,
} from "@/lib/api/watch-later";
import type { Vod } from "@/lib/types";

export default function LibraryScreen() {
  const { followsList, isAuthenticated } = useAuth();

  const followingQ = useQuery({
    queryKey: [
      "library",
      "following",
      followsList.map((f) => `${f.type}:${f.id}`).join("|"),
    ],
    enabled: isAuthenticated && followsList.length > 0,
    queryFn: async () => resolveFollowingItems(followsList),
  });

  const historyQ = useQuery({
    queryKey: ["library", "history"],
    enabled: isAuthenticated,
    queryFn: () => listMyVodProgress(50),
  });
  const history = React.useMemo<Vod[]>(
    () => (historyQ.data ?? []).map(progressEntryToVod),
    [historyQ.data],
  );

  const watchLaterQ = useQuery({
    queryKey: ["library", "watch-later"],
    enabled: isAuthenticated,
    queryFn: () => listWatchLater(50),
  });
  const watchLater = React.useMemo<Vod[]>(
    () => (watchLaterQ.data ?? []).map(watchLaterEntryToVod),
    [watchLaterQ.data],
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-background">
        <TopNavbar />
        <View className="px-4 pt-4 pb-2">
          <Text className="text-2xl font-bold text-foreground">Library</Text>
          <Text className="text-sm text-muted-foreground mt-1">
            Continue watching, saved VODs, downloads, and history.
          </Text>
        </View>
        <View className="flex-1 px-4 pt-2">
          <LibraryTabs
            following={followingQ.data ?? []}
            history={history}
            watchLater={watchLater}
            defaultValue={
              watchLater.length > 0
                ? "watch-later"
                : history.length > 0
                  ? "history"
                  : "downloads"
            }
          />
        </View>
      </View>
    </>
  );
}

/**
 * Adapt a vod_progress + VOD-join row into the Vod shape the LibraryTabs
 * VodRow expects. We don't have hlsUrl / mp4Url in the join (lossless they'd
 * trigger a heavier fetch) but the row component only reads
 * id/title/thumbnailUrl/durationSec, so we stub the rest.
 */
function progressEntryToVod(row: VodProgressEntry): Vod {
  return {
    id: row.vodId,
    streamId: null,
    title: row.title,
    description: "",
    gameId: row.gameId,
    durationSec: row.durationSec,
    hlsUrl: "",
    mp4Url: "",
    thumbnailUrl: row.thumbnailUrl,
    publishedAt: row.updatedAt,
    chapters: [],
    viewCount: 0,
    likeCount: 0,
    isPremium: row.isPremium,
    pillar: row.pillar ?? undefined,
  };
}

/** Same lossy adapter as `progressEntryToVod` but using `createdAt` as the
 *  fake `publishedAt`. VodRow only renders id/title/thumbnail/duration so
 *  the other fields are stubbed. */
function watchLaterEntryToVod(row: WatchLaterEntry): Vod {
  return {
    id: row.vodId,
    streamId: null,
    title: row.title,
    description: "",
    gameId: row.gameId,
    durationSec: row.durationSec,
    hlsUrl: "",
    mp4Url: "",
    thumbnailUrl: row.thumbnailUrl,
    publishedAt: row.createdAt,
    chapters: [],
    viewCount: 0,
    likeCount: 0,
    isPremium: row.isPremium,
    pillar: row.pillar ?? undefined,
  };
}

/**
 * Resolve `{type,id}` follow keys into display rows for the Following tab.
 *
 * - team → listTeams() join by id; href to /team/[slug]
 * - player → listPlayers() join by id; no public detail route yet, so href
 *   falls back to the player's team page when available
 * - streamer → getStreamById(id) per follow; href to /stream/[id]
 *
 * Concurrency: kicks off the team + player list fetches once and runs the
 * per-stream fetches in parallel via Promise.all. Quiet-fails any 404 so a
 * stale follow doesn't blank the tab.
 */
async function resolveFollowingItems(
  follows: { type: "team" | "player" | "streamer"; id: string }[],
): Promise<FollowingItem[]> {
  const teamIds = follows.filter((f) => f.type === "team").map((f) => f.id);
  const playerIds = follows.filter((f) => f.type === "player").map((f) => f.id);
  const streamerIds = follows.filter((f) => f.type === "streamer").map((f) => f.id);

  const [teams, players, streamers] = await Promise.all([
    teamIds.length > 0 ? listTeams() : Promise.resolve([]),
    playerIds.length > 0 ? listPlayers() : Promise.resolve([]),
    Promise.all(
      streamerIds.map((id) => getStreamById(id).catch(() => null)),
    ),
  ]);

  const items: FollowingItem[] = [];

  for (const id of teamIds) {
    const t = teams.find((x) => x.id === id);
    if (!t) continue;
    items.push({
      id: `team:${t.id}`,
      name: t.name,
      imageUrl: t.logoUrl,
      href: `/team/${t.slug}`,
      subtitle: t.tag,
    });
  }

  for (const id of playerIds) {
    const p = players.find((x) => x.id === id);
    if (!p) continue;
    const team = p.teamId ? teams.find((t) => t.id === p.teamId) : null;
    items.push({
      id: `player:${p.id}`,
      name: p.handle,
      imageUrl: p.avatarUrl,
      href: team ? `/team/${team.slug}` : "/team",
      subtitle: team ? team.name : "Player",
    });
  }

  for (const stream of streamers) {
    if (!stream) continue;
    items.push({
      id: `streamer:${stream.id}`,
      name: stream.streamerName,
      imageUrl: stream.streamerAvatarUrl,
      href: `/stream/${stream.id}`,
      subtitle: stream.isLive ? "Live now" : "Offline",
    });
  }

  return items;
}
