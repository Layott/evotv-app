import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  Trophy,
  Users,
} from "lucide-react-native";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getGameBySlug } from "@/lib/api/games";
import { listLiveStreams } from "@/lib/api/streams";
import { listEvents } from "@/lib/api/events";
import { listTeams } from "@/lib/api/teams";
import { listPlayers } from "@/lib/api/players";
import { listVods } from "@/lib/api/vods";

function formatViewers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
function formatNgn(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `₦${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}K`;
  return `₦${n.toLocaleString()}`;
}

function LiveBadge() {
  return (
    <View
      className="flex-row items-center gap-1 rounded-md px-2 py-0.5"
      style={{
        borderWidth: 1,
        borderColor: "rgba(239,68,68,0.3)",
        backgroundColor: "rgba(239,68,68,0.1)",
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: "#ef4444",
        }}
      />
      <Text
        style={{
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 1,
          color: "#fca5a5",
        }}
      >
        LIVE
      </Text>
    </View>
  );
}

export default function CategoryDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const gameSlug = slug as string;

  const gameQ = useQuery({
    queryKey: ["game", gameSlug],
    queryFn: () => getGameBySlug(gameSlug),
  });
  const game = gameQ.data;

  const liveQ = useQuery({
    queryKey: ["streams", "live", game?.id],
    queryFn: () => listLiveStreams({ gameId: game!.id }),
    enabled: !!game,
  });
  const upcomingQ = useQuery({
    queryKey: ["events", "scheduled", game?.id],
    queryFn: () => listEvents({ gameId: game!.id, status: "scheduled" }),
    enabled: !!game,
  });
  const teamsQ = useQuery({
    queryKey: ["teams", game?.id],
    queryFn: () => listTeams({ gameId: game!.id }),
    enabled: !!game,
  });
  const playersQ = useQuery({
    queryKey: ["players", game?.id],
    queryFn: () => listPlayers({ gameId: game!.id }),
    enabled: !!game,
  });
  const vodsQ = useQuery({
    queryKey: ["vods", game?.id],
    queryFn: () => listVods({ gameId: game!.id, limit: 12 }),
    enabled: !!game,
  });

  if (!gameQ.isPending && !game) {
    return (
      <>
        <Stack.Screen options={{ title: "Category" }} />
        <View className="flex-1 items-center justify-center bg-background px-4">
          <Text className="text-2xl font-bold text-foreground">
            Category not found
          </Text>
          <Text className="mt-2 text-sm text-muted-foreground">
            The game you're looking for doesn't exist or was removed.
          </Text>
          <Button
            className="mt-6 bg-brand"
            textClassName="text-black"
            onPress={() => router.push("/categories")}
          >
            <ArrowLeft size={14} color="#000" />
            <Text className="text-sm font-semibold text-black">
              Back to categories
            </Text>
          </Button>
        </View>
      </>
    );
  }

  if (!game) {
    return (
      <>
        <Stack.Screen options={{ title: "Category" }} />
        <View className="flex-1 bg-background px-4 py-6">
          <Skeleton style={{ height: 224, borderRadius: 12 }} />
        </View>
      </>
    );
  }

  const live = liveQ.data ?? [];
  const upcoming = upcomingQ.data ?? [];
  const teams = teamsQ.data ?? [];
  const players = playersQ.data ?? [];
  const vods = vodsQ.data ?? [];

  return (
    <>
      <Stack.Screen options={{ title: game.name }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="mb-6 overflow-hidden border-b border-border">
          <View style={{ aspectRatio: 16 / 9, position: "relative" }}>
            <Image
              source={game.coverUrl}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
            <View
              className="absolute inset-x-0 bottom-0 h-2/3"
              style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
            />
            <View className="absolute inset-x-0 bottom-0 gap-2 p-4">
              <Pressable
                onPress={() => router.push("/categories")}
                className="flex-row items-center gap-1 self-start"
              >
                <ArrowLeft size={12} color="#a3a3a3" />
                <Text style={{ fontSize: 11, color: "#a3a3a3" }}>
                  All categories
                </Text>
              </Pressable>
              <View className="flex-row items-center gap-3">
                <Image
                  source={game.iconUrl}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "#404040",
                  }}
                  contentFit="cover"
                />
                <View>
                  <Text className="text-2xl font-bold text-white">
                    {game.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#d4d4d4" }}>
                    {game.shortName} · {game.platform}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1">
                <Users size={12} color="#d4d4d4" />
                <Text style={{ fontSize: 11, color: "#d4d4d4" }}>
                  {formatViewers(game.activePlayers)} active players
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="px-4">
          <Tabs defaultValue="live">
            <TabsList>
              <TabsTrigger value="live">Live</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="players">Players</TabsTrigger>
              <TabsTrigger value="vods">VODs</TabsTrigger>
            </TabsList>

            <TabsContent value="live" className="mt-4">
              {liveQ.isPending ? (
                <View className="gap-4">
                  <Skeleton
                    style={{ aspectRatio: 16 / 9, borderRadius: 12 }}
                  />
                </View>
              ) : live.length === 0 ? (
                <View className="rounded-xl border border-border bg-card p-6">
                  <Text className="text-center text-sm text-muted-foreground">
                    No streams live for this game right now.
                  </Text>
                </View>
              ) : (
                <View className="gap-4">
                  {live.map((s) => (
                    <Pressable
                      key={s.id}
                      onPress={() => router.push(`/stream/${s.id}`)}
                      className="overflow-hidden rounded-xl border border-border bg-card active:opacity-80"
                    >
                      <View
                        style={{
                          aspectRatio: 16 / 9,
                          position: "relative",
                        }}
                      >
                        <Image
                          source={s.thumbnailUrl}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                        <View className="absolute left-2 top-2">
                          <LiveBadge />
                        </View>
                        <View
                          className="absolute bottom-2 right-2 flex-row items-center gap-1 rounded-md px-1.5 py-0.5"
                          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
                        >
                          <Eye size={11} color="#e5e5e5" />
                          <Text
                            style={{ fontSize: 11, color: "#e5e5e5" }}
                          >
                            {formatViewers(s.viewerCount)}
                          </Text>
                        </View>
                      </View>
                      <View className="p-3">
                        <Text
                          className="text-sm font-semibold text-foreground"
                          numberOfLines={2}
                        >
                          {s.title}
                        </Text>
                        <Text
                          className="mt-1 text-xs text-muted-foreground"
                        >
                          {s.streamerName}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </TabsContent>

            <TabsContent value="events" className="mt-4">
              {upcomingQ.isPending ? (
                <View className="gap-3">
                  <Skeleton style={{ height: 96, borderRadius: 12 }} />
                </View>
              ) : upcoming.length === 0 ? (
                <View className="rounded-xl border border-border bg-card p-6">
                  <Text className="text-center text-sm text-muted-foreground">
                    No upcoming events scheduled for {game.shortName}.
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {upcoming.map((ev) => (
                    <Pressable
                      key={ev.id}
                      onPress={() => router.push(`/events/${ev.id}`)}
                      className="flex-row gap-3 rounded-xl border border-border bg-card p-3 active:opacity-80"
                    >
                      <Image
                        source={ev.thumbnailUrl}
                        style={{
                          height: 80,
                          width: 128,
                          borderRadius: 6,
                        }}
                        contentFit="cover"
                      />
                      <View className="min-w-0 flex-1">
                        <Text
                          className="text-sm font-semibold text-foreground"
                          numberOfLines={1}
                        >
                          {ev.title}
                        </Text>
                        <View className="mt-1 flex-row items-center gap-1">
                          <Calendar size={11} color="#a3a3a3" />
                          <Text
                            style={{ fontSize: 11, color: "#a3a3a3" }}
                          >
                            {new Date(ev.startsAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <View className="mt-1 flex-row items-center gap-1">
                          <Trophy size={11} color="#fcd34d" />
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "600",
                              color: "#fcd34d",
                            }}
                          >
                            {formatNgn(ev.prizePoolNgn)}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </TabsContent>

            <TabsContent value="teams" className="mt-4">
              {teamsQ.isPending ? (
                <View className="gap-3">
                  <Skeleton style={{ height: 80, borderRadius: 12 }} />
                </View>
              ) : teams.length === 0 ? (
                <View className="rounded-xl border border-border bg-card p-6">
                  <Text className="text-center text-sm text-muted-foreground">
                    No teams for {game.shortName}.
                  </Text>
                </View>
              ) : (
                <View className="gap-4">
                  {teams.map((t) => (
                    <Pressable
                      key={t.id}
                      onPress={() => router.push(`/team/${t.slug}`)}
                      className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3 active:opacity-80"
                    >
                      <Image
                        source={t.logoUrl}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: "#262626",
                        }}
                        contentFit="cover"
                      />
                      <View className="min-w-0 flex-1">
                        <Text
                          className="text-sm font-semibold text-foreground"
                          numberOfLines={1}
                        >
                          {t.name}
                        </Text>
                        <Text style={{ fontSize: 11, color: "#a3a3a3" }}>
                          #{t.ranking} · {t.wins}-{t.losses}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </TabsContent>

            <TabsContent value="players" className="mt-4">
              {playersQ.isPending ? (
                <View className="gap-3">
                  <Skeleton style={{ height: 80, borderRadius: 12 }} />
                </View>
              ) : players.length === 0 ? (
                <View className="rounded-xl border border-border bg-card p-6">
                  <Text className="text-center text-sm text-muted-foreground">
                    No players for {game.shortName}.
                  </Text>
                </View>
              ) : (
                <View className="gap-4">
                  {players.map((p) => (
                    <View
                      key={p.id}
                      className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3"
                    >
                      <Image
                        source={p.avatarUrl}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          borderWidth: 1,
                          borderColor: "#262626",
                        }}
                        contentFit="cover"
                      />
                      <View className="min-w-0 flex-1">
                        <Text
                          className="text-sm font-semibold text-foreground"
                          numberOfLines={1}
                        >
                          {p.handle}
                        </Text>
                        <Text style={{ fontSize: 11, color: "#a3a3a3" }}>
                          {p.role} · KDA {p.kda.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </TabsContent>

            <TabsContent value="vods" className="mt-4">
              {vodsQ.isPending ? (
                <View className="gap-4">
                  <Skeleton
                    style={{ aspectRatio: 16 / 9, borderRadius: 12 }}
                  />
                </View>
              ) : vods.length === 0 ? (
                <View className="rounded-xl border border-border bg-card p-6">
                  <Text className="text-center text-sm text-muted-foreground">
                    No VODs for {game.shortName} yet.
                  </Text>
                </View>
              ) : (
                <View className="gap-4">
                  {vods.map((v) => (
                    <Pressable
                      key={v.id}
                      onPress={() => router.push(`/vod/${v.id}`)}
                      className="overflow-hidden rounded-xl border border-border bg-card active:opacity-80"
                    >
                      <View
                        style={{
                          aspectRatio: 16 / 9,
                          position: "relative",
                        }}
                      >
                        <Image
                          source={v.thumbnailUrl}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                        <View
                          className="absolute bottom-2 right-2 flex-row items-center gap-1 rounded-md px-1.5 py-0.5"
                          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
                        >
                          <Clock size={11} color="#e5e5e5" />
                          <Text
                            style={{ fontSize: 11, color: "#e5e5e5" }}
                          >
                            {formatDuration(v.durationSec)}
                          </Text>
                        </View>
                      </View>
                      <View className="p-3">
                        <Text
                          className="text-sm font-semibold text-foreground"
                          numberOfLines={2}
                        >
                          {v.title}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </TabsContent>
          </Tabs>
        </View>
      </ScrollView>
    </>
  );
}
