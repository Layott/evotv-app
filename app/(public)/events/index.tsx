import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, Trophy } from "lucide-react-native";

import { TopNavbar } from "@/components/home/top-navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { listEvents } from "@/lib/api/events";
import { listGames } from "@/lib/api/games";
import type { EsportsEvent, EventTier } from "@/lib/types";

type SortKey = "soonest" | "prize";

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

function EventCard({
  event,
  gameName,
}: {
  event: EsportsEvent;
  gameName?: string;
}) {
  const router = useRouter();
  const tier = tierStyle(event.tier);
  return (
    <Pressable
      onPress={() => router.push(`/events/${event.id}`)}
      className="flex-row overflow-hidden rounded-xl border border-border bg-card active:opacity-80"
    >
      <View
        style={{
          width: 128,
          aspectRatio: 1,
          position: "relative",
          backgroundColor: "#0d0d0d",
        }}
      >
        <Image
          source={event.bannerUrl}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        <View
          className="absolute left-2 top-2 rounded-md px-1.5 py-0.5"
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
            {event.tier.toUpperCase()}
          </Text>
        </View>
        {event.status === "live" ? (
          <View className="absolute left-2 top-9">
            <LiveBadge />
          </View>
        ) : null}
      </View>
      <View className="flex-1 gap-1 p-3">
        <Text
          className="text-sm font-semibold text-foreground"
          numberOfLines={2}
        >
          {event.title}
        </Text>
        {gameName ? (
          <Text style={{ fontSize: 11, color: "#67e8f9" }}>{gameName}</Text>
        ) : null}
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <Calendar size={11} color="#a3a3a3" />
            <Text style={{ fontSize: 11, color: "#a3a3a3" }}>
              {new Date(event.startsAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <MapPin size={11} color="#a3a3a3" />
            <Text style={{ fontSize: 11, color: "#a3a3a3" }}>
              {event.region}
            </Text>
          </View>
        </View>
        <View className="mt-auto flex-row items-center gap-1 pt-1">
          <Trophy size={13} color="#fcd34d" />
          <Text
            style={{ fontSize: 13, fontWeight: "600", color: "#fcd34d" }}
          >
            {formatNgn(event.prizePoolNgn)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function Chip({
  active,
  onPress,
  label,
  toneActive,
}: {
  active: boolean;
  onPress: () => void;
  label: string;
  toneActive?: { borderColor: string; backgroundColor: string; color: string };
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-full border px-3 py-1 active:opacity-70"
      style={{
        borderColor: active
          ? toneActive?.borderColor ?? "rgba(44,215,227,0.5)"
          : "#262626",
        backgroundColor: active
          ? toneActive?.backgroundColor ?? "rgba(44,215,227,0.1)"
          : "rgba(15,15,15,0.6)",
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "500",
          color: active
            ? toneActive?.color ?? "#67e8f9"
            : "#a3a3a3",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <Text className="px-4 text-xl font-semibold tracking-tight text-foreground">
      {children}
    </Text>
  );
}

export default function EventsScreen() {
  const [gameFilter, setGameFilter] = React.useState<string | null>(null);
  const [tierFilter, setTierFilter] = React.useState<EventTier | null>(null);
  const [sort, setSort] = React.useState<SortKey>("soonest");

  const games = useQuery({ queryKey: ["games"], queryFn: () => listGames() });
  const events = useQuery({
    queryKey: ["events", "all", gameFilter],
    queryFn: () =>
      listEvents(gameFilter ? { gameId: gameFilter } : undefined),
  });

  const gameMap = new Map((games.data ?? []).map((g) => [g.id, g]));
  const all = (events.data ?? []).filter((e) =>
    tierFilter ? e.tier === tierFilter : true,
  );

  const sortEvents = (arr: EsportsEvent[]) => {
    const copy = [...arr];
    if (sort === "prize") copy.sort((a, b) => b.prizePoolNgn - a.prizePoolNgn);
    else
      copy.sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
    return copy;
  };

  const live = sortEvents(all.filter((e) => e.status === "live"));
  const upcoming = sortEvents(all.filter((e) => e.status === "scheduled"));
  const past = sortEvents(all.filter((e) => e.status === "completed"));

  const renderList = (arr: EsportsEvent[]) => (
    <View className="gap-4 px-4">
      {arr.map((ev) => (
        <EventCard
          key={ev.id}
          event={ev}
          gameName={gameMap.get(ev.gameId)?.shortName}
        />
      ))}
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <TopNavbar />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingVertical: 16, paddingBottom: 32 }}
      >
        <View className="gap-1 px-4 pb-4">
          <Text className="text-2xl font-bold tracking-tight text-foreground">
            Events
          </Text>
          <Text className="text-sm text-muted-foreground">
            Tournaments and invitationals across African esports.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          <Chip
            active={gameFilter === null}
            onPress={() => setGameFilter(null)}
            label="All games"
          />
          {(games.data ?? []).map((g) => (
            <Chip
              key={g.id}
              active={gameFilter === g.id}
              onPress={() => setGameFilter(g.id)}
              label={g.shortName}
            />
          ))}
        </ScrollView>

        <View className="mt-3 px-4">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text style={{ fontSize: 11, color: "#737373" }}>Tier:</Text>
            {(["s", "a", "b", "c"] as EventTier[]).map((t) => {
              const tone = tierStyle(t);
              return (
                <Chip
                  key={t}
                  active={tierFilter === t}
                  onPress={() => setTierFilter(tierFilter === t ? null : t)}
                  label={t.toUpperCase()}
                  toneActive={tone}
                />
              );
            })}
            <View className="ml-auto flex-row items-center gap-2">
              <Text style={{ fontSize: 11, color: "#737373" }}>Sort:</Text>
              <Chip
                active={sort === "soonest"}
                onPress={() => setSort("soonest")}
                label="Soonest"
              />
              <Chip
                active={sort === "prize"}
                onPress={() => setSort("prize")}
                label="Prize"
              />
            </View>
          </View>
        </View>

        <View className="mt-6 gap-6">
          {events.isPending ? (
            <View className="gap-3 px-4">
              <Skeleton style={{ height: 112, borderRadius: 12 }} />
              <Skeleton style={{ height: 112, borderRadius: 12 }} />
              <Skeleton style={{ height: 112, borderRadius: 12 }} />
            </View>
          ) : all.length === 0 ? (
            <View className="mx-4 rounded-xl border border-border bg-card p-8">
              <Text className="text-center text-sm text-muted-foreground">
                No events match your filters.
              </Text>
            </View>
          ) : (
            <>
              {live.length > 0 ? (
                <View className="gap-3">
                  <View className="flex-row items-center gap-2 px-4">
                    <LiveBadge />
                    <Text className="text-xl font-semibold tracking-tight text-foreground">
                      Happening now
                    </Text>
                  </View>
                  {renderList(live)}
                </View>
              ) : null}
              {upcoming.length > 0 ? (
                <View className="gap-3">
                  <SectionHeader>Upcoming</SectionHeader>
                  {renderList(upcoming)}
                </View>
              ) : null}
              {past.length > 0 ? (
                <View className="gap-3">
                  <SectionHeader>Past events</SectionHeader>
                  {renderList(past)}
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
