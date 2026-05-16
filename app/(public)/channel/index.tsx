import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { Clock, Eye, Heart, Info, Radio } from "lucide-react-native";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getMainChannel, listLiveStreams } from "@/lib/api/streams";
import { listTrendingClips } from "@/lib/api/vods";
import { listEvents } from "@/lib/api/events";

function fmtViewers(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${n}`;
}

const SCHEDULE = [
  { slot: "00:00 – 02:00", title: "Weekly Recap: EVO Week 4", tag: "Recap" },
  { slot: "02:00 – 04:00", title: "Film Room — Team Alpha", tag: "Analysis" },
  { slot: "04:00 – 06:00", title: "Best Plays Mixtape", tag: "Highlights" },
  { slot: "06:00 – 08:00", title: "Evo Talk S3 E12", tag: "Show" },
  { slot: "08:00 – 10:00", title: "CoD Mobile Scrim Night", tag: "Live" },
  { slot: "10:00 – 12:00", title: "Casters' Cut", tag: "Podcast" },
];

export default function ChannelScreen() {
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

  const channel = channelQ.data;

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
            borderWidth: 1,
            borderColor: "rgba(44,215,227,0.2)",
            backgroundColor: "#05091a",
          }}
        >
          <View className="p-6">
            <View className="mb-3 flex-row flex-wrap items-center gap-2">
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
              <View
                className="rounded-md px-2 py-0.5"
                style={{
                  borderWidth: 1,
                  borderColor: "rgba(44,215,227,0.3)",
                  backgroundColor: "rgba(44,215,227,0.1)",
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
              <View
                className="rounded-md px-2 py-0.5"
                style={{
                  borderWidth: 1,
                  borderColor: "#262626",
                  backgroundColor: "rgba(15,15,15,0.8)",
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "600",
                    letterSpacing: 1,
                    color: "#a3a3a3",
                  }}
                >
                  24 / 7
                </Text>
              </View>
            </View>
            <View className="mb-2 flex-row items-center gap-3">
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "rgba(44,215,227,0.3)",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 6,
                  backgroundColor: "#05091a",
                }}
              >
                <Image
                  source={
                    "https://evotv.vercel.app/evo-logo/evo-tv-152.png"
                  }
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
              <View className="flex-row items-center gap-1">
                <Eye size={13} color="#a3a3a3" />
                <Text style={{ fontSize: 11, color: "#a3a3a3" }}>
                  {channel ? fmtViewers(channel.viewerCount) : "…"} watching
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Clock size={13} color="#a3a3a3" />
                <Text style={{ fontSize: 11, color: "#a3a3a3" }}>
                  Running 72h+
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Radio size={13} color="#67e8f9" />
                <Text style={{ fontSize: 11, color: "#a3a3a3" }}>
                  Simulcast on app + web
                </Text>
              </View>
            </View>
            <View className="mt-6 flex-row gap-3">
              <Button
                onPress={() => router.push("/stream/channel_main")}
                className="rounded-full bg-brand"
                textClassName="text-black"
              >
                Watch now
              </Button>
              <Pressable
                onPress={() => toast.success("Following EVO TV Channel")}
                className="flex-row items-center gap-2 rounded-full border border-border px-5 py-2.5 active:opacity-80"
              >
                <Heart size={14} color="#e5e5e5" />
                <Text className="text-sm text-foreground">Follow</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Today's schedule */}
        <View className="mt-8">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold tracking-tight text-foreground">
              Today's schedule
            </Text>
            <Text style={{ fontSize: 11, color: "#737373" }}>
              All times WAT
            </Text>
          </View>
          <View className="overflow-hidden rounded-xl border border-border bg-card">
            {SCHEDULE.map((row, i) => (
              <View
                key={row.slot}
                className="flex-row items-center justify-between gap-3 px-4 py-3"
                style={{
                  backgroundColor: i % 2 === 0 ? "rgba(15,15,15,0.3)" : "transparent",
                  borderBottomWidth: i < SCHEDULE.length - 1 ? 1 : 0,
                  borderBottomColor: "#262626",
                }}
              >
                <Text
                  style={{ fontSize: 12, color: "#a3a3a3" }}
                  className="shrink-0"
                >
                  {row.slot}
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
                    borderWidth: 1,
                    borderColor: "#262626",
                    backgroundColor: "rgba(15,15,15,0.5)",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      letterSpacing: 1,
                      color: "#a3a3a3",
                      textTransform: "uppercase",
                    }}
                  >
                    {row.tag}
                  </Text>
                </View>
              </View>
            ))}
          </View>
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
                          borderWidth: 1,
                          borderColor: "rgba(239,68,68,0.3)",
                          backgroundColor: "rgba(239,68,68,0.1)",
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
                          style={{ fontSize: 10, color: "#e5e5e5" }}
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
                      <Text style={{ fontSize: 11, color: "#737373" }}>
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
                        color: "#e5e5e5",
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
                      borderWidth: 1,
                      borderColor: "rgba(44,215,227,0.3)",
                      backgroundColor: "rgba(44,215,227,0.1)",
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
                      color: "#737373",
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
                  style={{ fontSize: 11, color: "#737373", marginTop: 4 }}
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
            The EVO TV Channel runs 24/7 on localhost during dev. In production,
            this is the flagship broadcast feed — programmatic mix of simulcasts,
            shows, highlights, and paid placements. Free viewers see pre-roll
            ads; Premium subscribers get an ad-free feed with a higher bitrate
            ladder.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}
