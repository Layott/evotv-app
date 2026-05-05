import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Calendar, Trophy } from "lucide-react-native";

import type { EsportsEvent, Game } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface UpcomingEventsProps {
  events: EsportsEvent[];
  games: Game[];
  loading: boolean;
}

function formatNgn(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `₦${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}K`;
  return `₦${n.toLocaleString()}`;
}

function tierStyle(t: string): {
  borderColor: string;
  backgroundColor: string;
  color: string;
} {
  switch (t) {
    case "s":
      return {
        borderColor: "rgba(245,158,11,0.4)",
        backgroundColor: "rgba(245,158,11,0.1)",
        color: "#fcd34d",
      };
    case "a":
    case "b":
      return {
        borderColor: "rgba(44,215,227,0.4)",
        backgroundColor: "rgba(44,215,227,0.1)",
        color: "#67e8f9",
      };
    default:
      return {
        borderColor: "#404040",
        backgroundColor: "#262626",
        color: "#d4d4d4",
      };
  }
}

function SkeletonCard() {
  return <Skeleton style={{ height: 96, borderRadius: 12 }} />;
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function countdownLabel(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Started";
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `In ${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `In ${hr}h`;
  const day = Math.floor(hr / 24);
  return `In ${day}d`;
}

export function UpcomingEvents({
  events,
  games,
  loading,
}: UpcomingEventsProps) {
  const router = useRouter();
  const gameMap = React.useMemo(
    () => new Map(games.map((g) => [g.id, g])),
    [games],
  );

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between px-4">
        <Text className="text-xl font-semibold text-foreground">
          Upcoming Events
        </Text>
        <Pressable
          onPress={() => router.push("/events")}
          className="active:opacity-70"
        >
          <Text className="text-xs font-medium" style={{ color: "#2CD7E3" }}>
            See all
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="gap-3 px-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : events.length === 0 ? (
        <View className="mx-4 rounded-xl border border-border bg-card p-6">
          <Text className="text-center text-sm text-muted-foreground">
            No upcoming events scheduled.
          </Text>
        </View>
      ) : (
        <View className="gap-3 px-4">
          {events.map((ev) => {
            const game = gameMap.get(ev.gameId);
            const tier = tierStyle(ev.tier);
            return (
              <Pressable
                key={ev.id}
                onPress={() => router.push(`/events/${ev.id}`)}
                className="overflow-hidden rounded-xl border border-border bg-card active:opacity-80"
              >
                <View
                  style={{ aspectRatio: 16 / 9 }}
                  className="relative overflow-hidden"
                >
                  <Image
                    source={ev.bannerUrl}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                  <View
                    className="absolute inset-x-0 bottom-0 h-2/3"
                    style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
                  />
                  <View
                    className="absolute left-2 top-2 rounded-md px-2 py-0.5"
                    style={{
                      borderWidth: 1,
                      borderColor: tier.borderColor,
                      backgroundColor: tier.backgroundColor,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "600",
                        letterSpacing: 1,
                        color: tier.color,
                      }}
                    >
                      TIER {ev.tier.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View className="gap-2 p-3">
                  <Text
                    className="text-sm font-semibold text-foreground"
                    numberOfLines={2}
                  >
                    {ev.title}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <Calendar size={12} color="#a3a3a3" />
                    <Text
                      style={{ fontSize: 11, color: "#a3a3a3" }}
                    >
                      {formatDateShort(ev.startsAt)}
                    </Text>
                    <Text
                      style={{ fontSize: 11, color: "#a3a3a3" }}
                    >
                      &middot;
                    </Text>
                    <Text style={{ fontSize: 11, color: "#a3a3a3" }}>
                      {countdownLabel(ev.startsAt)}
                    </Text>
                    {game ? (
                      <Text
                        style={{
                          marginLeft: "auto",
                          fontSize: 11,
                          color: "#2CD7E3",
                        }}
                      >
                        {game.shortName}
                      </Text>
                    ) : null}
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Trophy size={14} color="#fcd34d" />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: "#fcd34d",
                      }}
                    >
                      {formatNgn(ev.prizePoolNgn)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default UpcomingEvents;
export { UpcomingEvents as UpcomingEventsSection };
