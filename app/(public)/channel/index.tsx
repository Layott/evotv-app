import * as React from "react";
import { useTokens } from "@/lib/theme/tokens";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, Eye, Info, Radio } from "@/components/icons";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getMainChannel, listLiveStreams } from "@/lib/api/streams";
import { listTrendingClips } from "@/lib/api/vods";
import { listEvents } from "@/lib/api/events";
import { listScheduleForDay, type EpgRow } from "@/lib/api/schedule";

function fmtViewers(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${n}`;
}

function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function fmtSlot(row: EpgRow): string {
  const start = fmtTime(row.airsAt);
  if (!row.durationMin) return start;
  const end = new Date(
    new Date(row.airsAt).getTime() + row.durationMin * 60_000,
  );
  return `${start} - ${fmtTime(end.toISOString())}`;
}

function epgTag(row: EpgRow): string {
  if (row.state === "live") return "Live";
  if (row.kind === "match") return "Match";
  if (row.kind === "episode") return "Episode";
  return "Stream";
}

function fmtUptime(startedAt: string): string {
  const ms = Math.max(0, Date.now() - new Date(startedAt).getTime());
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `Live for ${Math.max(1, mins)}m`;
  return `Live for ${Math.floor(mins / 60)}h`;
}

export default function ChannelScreen() {
  const palette = useTokens();
  const router = useRouter();
  const channelQ = useQuery({
    queryKey: ["channel", "main"],
    queryFn: getMainChannel,
  });
  const liveQ = useQuery({
    queryKey: ["streams", "live", "ex-channel"],
    queryFn: () => listLiveStreams(),
  });
  const clipsQ = useQuery({
    queryKey: ["clips", "trending"],
    queryFn: () => listTrendingClips(6),
  });
  const eventsQ = useQuery({
    queryKey: ["events", "upcoming"],
    queryFn: () => listEvents({ status: "scheduled" }),
  });
  const todayIso = React.useMemo(() => isoDay(new Date()), []);
  const scheduleQ = useQuery({
    queryKey: ["schedule", "channel", todayIso],
    queryFn: () => listScheduleForDay({ date: todayIso }),
  });

  const channel = channelQ.data;
  const isLive = !!channel?.isLive;
  const scheduleRows = scheduleQ.data ?? [];

  return (
    <>
      <Stack.Screen options={{ title: "EVO TV Channel" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {/* Hero */}
        <View
          className="overflow-hidden rounded-2xl"
          style={{
            backgroundColor: "#05091a",
          }}
        >
          <View className="p-6">
            <View className="mb-3 flex-row flex-wrap items-center gap-2">
              {isLive ? (
                <View
                  className="flex-row items-center gap-1 rounded-md px-2 py-0.5"
                  style={{
                    backgroundColor: "rgba(239,68,68,0.25)",
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
              ) : (
                <View
                  className="rounded-md px-2 py-0.5"
                  style={{
                    backgroundColor: "rgba(15,15,15,0.8)",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "600",
                      letterSpacing: 1,
                      color: palette.muted,
                    }}
                  >
                    OFFLINE
                  </Text>
                </View>
              )}
              <View
                className="rounded-md px-2 py-0.5"
                style={{
                  backgroundColor: "rgba(70,227,206,0.25)",
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "600",
                    letterSpacing: 1,
                    color: "#67e8f9",
                  }}
                >
                  FLAGSHIP
                </Text>
              </View>
            </View>
            <View className="mb-2 flex-row items-center gap-3">
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 6,
                  backgroundColor: "#05091a",
                }}
              >
                <Image
                  source={require("@/assets/brand/evo-tv-152.png")}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="contain"
                />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold tracking-tight text-foreground">
                  {channel?.title ?? "EVO TV Channel"}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {channel?.description ?? "Non-stop esports, anime, and lifestyle programming."}
                </Text>
              </View>
            </View>
            <View className="mt-4 flex-row flex-wrap items-center gap-3">
              {isLive && channel ? (
                <View className="flex-row items-center gap-1">
                  <Eye size={13} color={palette.muted} />
                  <Text style={{ fontSize: 11, color: palette.muted }}>
                    {fmtViewers(channel.viewerCount)} watching
                  </Text>
                </View>
              ) : null}
              {isLive && channel?.startedAt ? (
                <View className="flex-row items-center gap-1">
                  <Clock size={13} color={palette.muted} />
                  <Text style={{ fontSize: 11, color: palette.muted }}>
                    {fmtUptime(channel.startedAt)}
                  </Text>
                </View>
              ) : null}
              <View className="flex-row items-center gap-1">
                <Radio size={13} color="#67e8f9" />
                <Text style={{ fontSize: 11, color: palette.muted }}>
                  Simulcast on app + web
                </Text>
              </View>
            </View>
            <View className="mt-6 flex-row gap-3">
              {isLive ? (
                <Button
                  onPress={() => router.push("/stream/channel_main")}
                  className="rounded-full bg-brand"
                  textClassName="text-black"
                >
                  Watch now
                </Button>
              ) : (
                <View className="items-center justify-center rounded-full border border-border px-5 py-2.5">
                  <Text className="text-sm text-muted-foreground">
                    Channel offline
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Today's schedule */}
        <View className="mt-8">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold tracking-tight text-foreground">
              Today's schedule
            </Text>
            <Text style={{ fontSize: 11, color: palette.muted }}>
              All times local
            </Text>
          </View>
          {scheduleQ.isPending ? (
            <View className="gap-2">
              <Skeleton style={{ height: 44, borderRadius: 12 }} />
              <Skeleton style={{ height: 44, borderRadius: 12 }} />
              <Skeleton style={{ height: 44, borderRadius: 12 }} />
            </View>
          ) : scheduleRows.length === 0 ? (
            <View className="rounded-xl border border-border bg-card p-6">
              <Text className="text-center text-sm text-muted-foreground">
                No programming scheduled today.
              </Text>
            </View>
          ) : (
            <View className="overflow-hidden rounded-xl border border-border bg-card">
              {scheduleRows.map((row, i) => (
                <View
                  key={row.id}
                  className="flex-row items-center justify-between gap-3 px-4 py-3"
                  style={{
                    backgroundColor: i % 2 === 0 ? "rgba(15,15,15,0.3)" : "transparent",
                    borderBottomWidth: i < scheduleRows.length - 1 ? 1 : 0,
                    borderBottomColor: palette.subtle,
                  }}
                >
                  <Text
                    style={{ fontSize: 12, color: palette.muted }}
                    className="shrink-0"
                  >
                    {fmtSlot(row)}
                  </Text>
                  <Text
                    className="flex-1 text-sm text-foreground"
                    numberOfLines={1}
                  >
                    {row.title}
                  </Text>
                  <View
                    className="rounded-md px-2 py-0.5"
                    style={{
                      backgroundColor: "rgba(15,15,15,0.5)",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        letterSpacing: 1,
                        color: palette.muted,
                        textTransform: "uppercase",
                      }}
                    >
                      {epgTag(row)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Live across EVO TV */}
        <View className="mt-10">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold tracking-tight text-foreground">
              Live across EVO TV
            </Text>
            <Pressable
              onPress={() => router.push("/discover")}
              className="active:opacity-70"
            >
              <Text style={{ fontSize: 11, color: "#67e8f9" }}>
                See all →
              </Text>
            </Pressable>
          </View>
          {liveQ.isPending ? (
            <View className="gap-4">
              <Skeleton style={{ aspectRatio: 16 / 9, borderRadius: 12 }} />
            </View>
          ) : (
            <View className="gap-4">
              {(liveQ.data ?? [])
                .filter((s) => s.id !== "channel_main")
                .slice(0, 6)
                .map((s) => (
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
                        style={{
                          width: "100%",
                          height: "100%",
                          opacity: 0.85,
                        }}
                        contentFit="cover"
                      />
                      <View
                        className="absolute left-2 top-2 flex-row items-center gap-1 rounded-md px-1.5 py-0.5"
                        style={{
                          backgroundColor: "rgba(239,68,68,0.25)",
                        }}
                      >
                        <View
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: 2,
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
                      <View
                        className="absolute right-2 top-2 rounded-md px-1.5 py-0.5"
                        style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
                      >
                        <Text
                          style={{ fontSize: 10, color: palette.fg }}
                        >
                          {fmtViewers(s.viewerCount)}
                        </Text>
                      </View>
                    </View>
                    <View className="p-3">
                      <Text
                        className="text-sm font-medium text-foreground"
                        numberOfLines={1}
                      >
                        {s.title}
                      </Text>
                      <Text style={{ fontSize: 11, color: palette.muted }}>
                        {s.streamerName}
                      </Text>
                    </View>
                  </Pressable>
                ))}
            </View>
          )}
        </View>

        {/* Trending clips */}
        <View className="mt-10">
          <Text className="mb-3 text-lg font-semibold tracking-tight text-foreground">
            Trending clips
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {(clipsQ.data ?? []).slice(0, 6).map((c) => (
              <Pressable
                key={c.id}
                onPress={() => router.push(`/clips/${c.id}`)}
                className="overflow-hidden rounded-xl border border-border bg-card active:opacity-80"
                style={{ width: "48%" }}
              >
                <View
                  style={{
                    aspectRatio: 9 / 16,
                    position: "relative",
                  }}
                >
                  <Image
                    source={c.thumbnailUrl}
                    style={{
                      width: "100%",
                      height: "100%",
                      opacity: 0.85,
                    }}
                    contentFit="cover"
                  />
                  <View
                    className="absolute inset-x-0 bottom-0 p-2"
                    style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "500",
                        color: palette.fg,
                      }}
                      numberOfLines={2}
                    >
                      {c.title}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Upcoming */}
        <View className="mt-10">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold tracking-tight text-foreground">
              Upcoming on the channel
            </Text>
            <Pressable
              onPress={() => router.push("/events")}
              className="active:opacity-70"
            >
              <Text style={{ fontSize: 11, color: "#67e8f9" }}>
                All events →
              </Text>
            </Pressable>
          </View>
          <View className="gap-3">
            {(eventsQ.data ?? []).slice(0, 3).map((e) => (
              <Pressable
                key={e.id}
                onPress={() => router.push(`/events/${e.id}`)}
                className="rounded-xl border border-border bg-card p-4 active:opacity-80"
              >
                <View className="mb-2 flex-row items-center gap-2">
                  <View
                    className="rounded-md px-1.5 py-0.5"
                    style={{
                      backgroundColor: "rgba(70,227,206,0.25)",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "600",
                        color: "#67e8f9",
                      }}
                    >
                      Tier {e.tier.toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 10,
                      letterSpacing: 1,
                      color: palette.muted,
                      textTransform: "uppercase",
                    }}
                  >
                    {new Date(e.startsAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text
                  className="text-sm font-semibold text-foreground"
                  numberOfLines={2}
                >
                  {e.title}
                </Text>
                <Text
                  style={{ fontSize: 11, color: palette.muted, marginTop: 4 }}
                >
                  {e.region}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Info */}
        <View
          className="mt-10 flex-row items-start gap-3 rounded-xl border border-border bg-card p-4"
        >
          <Info size={14} color="#67e8f9" />
          <Text
            className="flex-1 text-xs leading-relaxed text-muted-foreground"
          >
            The EVO TV Channel is our flagship broadcast feed: simulcasts,
            shows, and highlights. Free viewers see pre-roll ads; Premium
            subscribers get an ad-free feed.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}
