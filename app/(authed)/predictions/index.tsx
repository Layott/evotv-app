import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Crown, Trophy } from "lucide-react-native";

import { formatDate } from "@/lib/utils";

import {
  getCoinBalance,
  listMyPredictions,
  listOpenPredictionEvents,
  type PredictionEventSummary,
} from "@/lib/api/predictions";
import { listGames } from "@/lib/api/games";
import { useMockAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CoinPill, formatCoins } from "@/components/engagement/coin-pill";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "sky" | "amber" | "emerald";
}) {
  return (
    <View
      className={cn(
        "flex-1 rounded-xl border bg-neutral-900/60 p-3",
        tone === "sky"
          ? "border-brand/20"
          : tone === "amber"
            ? "border-amber-500/20"
            : tone === "emerald"
              ? "border-emerald-500/20"
              : "border-neutral-800",
      )}
    >
      <Text className="text-[10px] uppercase tracking-wider text-neutral-500">
        {label}
      </Text>
      <Text className="mt-1 text-base font-bold tabular-nums text-neutral-100">
        {value}
      </Text>
    </View>
  );
}

function EventCard({
  event,
  gameName,
  onPress,
}: {
  event: PredictionEventSummary;
  gameName?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/60 active:opacity-80"
    >
      <View
        style={{ aspectRatio: 16 / 7, backgroundColor: "#171717" }}
        className="overflow-hidden"
      >
        <Image
          source={event.bannerUrl}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        <View className="absolute inset-0 bg-black/40" />
        {event.status === "live" ? (
          <View className="absolute left-2 top-2 flex-row items-center gap-1 rounded-md border border-red-500/40 bg-red-500/20 px-2 py-0.5">
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: "#F87171",
              }}
            />
            <Text className="text-[10px] uppercase text-red-300">Live</Text>
          </View>
        ) : (
          <View className="absolute left-2 top-2 rounded-md border border-brand/40 bg-brand/20 px-2 py-0.5">
            <Text className="text-[10px] uppercase text-brand">Scheduled</Text>
          </View>
        )}
      </View>
      <View className="gap-1.5 p-3">
        {gameName ? (
          <Text className="text-[10px] uppercase tracking-wider text-brand">
            {gameName}
          </Text>
        ) : null}
        <Text className="text-sm font-semibold text-neutral-100" numberOfLines={2}>
          {event.title}
        </Text>
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <Calendar size={11} color="#A3A3A3" />
            <Text className="text-[11px] text-neutral-400">
              {formatDate(event.startsAt, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Trophy size={11} color="#FCD34D" />
            <CoinPill coins={event.prizePoolCoins} tone="amber" />
          </View>
        </View>
        <Text className="text-[10px] text-neutral-500">
          {event.predictionCount.toLocaleString()} predictions ·{" "}
          {event.matchesOpen} matches
        </Text>
      </View>
    </Pressable>
  );
}

export default function PredictionsScreen() {
  const router = useRouter();
  const { user, role } = useMockAuth();
  const userId = user?.id ?? "user_current";

  const games = useQuery({ queryKey: ["games"], queryFn: () => listGames() });
  const events = useQuery({
    queryKey: ["predictions", "events"],
    queryFn: () => listOpenPredictionEvents(),
  });
  const balance = useQuery({
    queryKey: ["predictions", "balance", userId],
    queryFn: () => getCoinBalance(userId),
  });
  const my = useQuery({
    queryKey: ["predictions", "my", userId],
    queryFn: () => listMyPredictions(userId),
  });

  const gameMap = new Map((games.data ?? []).map((g) => [g.id, g]));
  const list = events.data ?? [];
  const live = list.filter((e) => e.status === "live");
  const upcoming = list.filter((e) => e.status === "scheduled");
  const myPicks = my.data ?? [];
  const won = myPicks.filter((p) => p.status === "won").length;
  const open = myPicks.filter((p) => p.status === "open").length;

  return (
    <>
      <Stack.Screen options={{ title: "Predictions" }} />
      <ScrollView className="flex-1 bg-background">
        <View className="px-4 py-5">
          <View className="flex-row items-end justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-neutral-50">
                Predictions
              </Text>
              <Text className="mt-1 text-sm text-neutral-400">
                Stake EVO Coins on outcomes across esports, anime, and lifestyle events. Picks lock when the event starts.
              </Text>
            </View>
            <Button
              variant="outline"
              size="sm"
              className="border-neutral-800"
              onPress={() => router.push("/predictions/leaderboard")}
              textClassName="text-neutral-200"
            >
              <Crown size={14} color="#FCD34D" />
              Leaderboard
            </Button>
          </View>

          <View className="mt-5 flex-row gap-2">
            <StatCard
              label="Coin balance"
              value={
                balance.isPending
                  ? "—"
                  : formatCoins(balance.data?.coins ?? 0)
              }
              tone="amber"
            />
            <StatCard
              label="Open picks"
              value={my.isPending ? "—" : open.toString()}
              tone="sky"
            />
          </View>
          <View className="mt-2 flex-row gap-2">
            <StatCard
              label="Wins"
              value={my.isPending ? "—" : won.toString()}
              tone="emerald"
            />
            <StatCard
              label="Total wagered"
              value={
                balance.isPending
                  ? "—"
                  : `${(balance.data?.lifetimeStakes ?? 0).toLocaleString()}`
              }
            />
          </View>

          {role === "guest" ? (
            <View className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
              <Text className="text-xs text-amber-200">
                Sign in to start placing picks. Guests get a free 1,000 coin
                balance.
              </Text>
            </View>
          ) : null}

          {events.isPending ? (
            <View className="mt-5 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-xl" />
              ))}
            </View>
          ) : list.length === 0 ? (
            <View className="mt-5 rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-10">
              <View className="items-center">
                <Trophy size={36} color="#525252" />
              </View>
              <Text className="mt-3 text-center text-sm font-semibold text-neutral-200">
                No open predictions right now.
              </Text>
              <Text className="mt-1 text-center text-xs text-neutral-500">
                Check back when the next event goes live.
              </Text>
            </View>
          ) : (
            <View className="mt-5 gap-6">
              {live.length > 0 ? (
                <View>
                  <View className="flex-row items-center gap-2">
                    <View className="flex-row items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5">
                      <View
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 3,
                          backgroundColor: "#F87171",
                        }}
                      />
                      <Text className="text-[10px] uppercase tracking-wider text-red-300">
                        Live
                      </Text>
                    </View>
                    <Text className="text-lg font-semibold text-neutral-100">
                      Open right now
                    </Text>
                  </View>
                  <View className="mt-2 gap-3">
                    {live.map((ev) => (
                      <EventCard
                        key={ev.eventId}
                        event={ev}
                        gameName={gameMap.get(ev.gameId)?.shortName}
                        onPress={() =>
                          router.push(`/predictions/${ev.eventId}`)
                        }
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {upcoming.length > 0 ? (
                <View>
                  <Text className="text-lg font-semibold text-neutral-100">
                    Upcoming
                  </Text>
                  <View className="mt-2 gap-3">
                    {upcoming.map((ev) => (
                      <EventCard
                        key={ev.eventId}
                        event={ev}
                        gameName={gameMap.get(ev.gameId)?.shortName}
                        onPress={() =>
                          router.push(`/predictions/${ev.eventId}`)
                        }
                      />
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}
