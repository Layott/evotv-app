import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  GitBranch,
  MapPin,
  Trophy,
} from "lucide-react-native";

import { listEvents } from "@/lib/api/events";
import { listGames } from "@/lib/api/games";
import { formatDate } from "@/lib/utils";
import { listMyEntries } from "@/lib/api/pickem";
import { useMockAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function PickemScreen() {
  const router = useRouter();
  const { user } = useMockAuth();
  const userId = user?.id ?? "user_current";

  const events = useQuery({
    queryKey: ["pickem", "events", "scheduled"],
    queryFn: () => listEvents({ status: "scheduled" }),
  });
  const games = useQuery({ queryKey: ["games"], queryFn: () => listGames() });
  const myEntries = useQuery({
    queryKey: ["pickem", "my-entries", userId],
    queryFn: () => listMyEntries(userId),
  });

  const gameMap = new Map((games.data ?? []).map((g) => [g.id, g]));
  const entrySet = new Map(
    (myEntries.data ?? []).map((e) => [e.eventId, e]),
  );

  return (
    <>
      <Stack.Screen options={{ title: "Pick'em" }} />
      <ScrollView className="flex-1 bg-background">
        <View className="px-4 py-5">
          <View className="flex-row items-center gap-2">
            <GitBranch size={22} color="#7DD3FC" />
            <Text className="text-2xl font-bold text-neutral-50">
              Pick'em Brackets
            </Text>
          </View>
          <Text className="mt-1 text-sm text-neutral-400">
            Predict every round before the tournament starts. Score 10 points
            per correct pick.
          </Text>

          {(myEntries.data?.length ?? 0) > 0 ? (
            <View className="mt-5">
              <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Your active brackets
              </Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {(myEntries.data ?? []).map((entry) => (
                  <Pressable
                    key={entry.id}
                    onPress={() => router.push(`/pickem/${entry.eventId}`)}
                    className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1.5"
                  >
                    <Text className="text-xs font-semibold text-brand">
                      Submitted · {entry.score} pts
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <View className="mt-5 flex-row items-center justify-between">
            <Text className="text-xl font-semibold text-neutral-100">
              Open events
            </Text>
            <Text className="text-xs text-neutral-500">
              {events.data?.length ?? 0} eligible
            </Text>
          </View>

          {events.isPending ? (
            <View className="mt-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </View>
          ) : (events.data ?? []).length === 0 ? (
            <View className="mt-4 rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-10">
              <View className="items-center">
                <GitBranch size={36} color="#525252" />
              </View>
              <Text className="mt-3 text-center text-sm font-semibold text-neutral-200">
                No open brackets right now.
              </Text>
              <Text className="mt-1 text-center text-xs text-neutral-500">
                Brackets unlock for any scheduled event.
              </Text>
            </View>
          ) : (
            <View className="mt-3 gap-3">
              {(events.data ?? []).map((ev) => {
                const entry = entrySet.get(ev.id);
                return (
                  <Pressable
                    key={ev.id}
                    onPress={() => router.push(`/pickem/${ev.id}`)}
                    className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/60 active:opacity-80"
                  >
                    <View className="flex-row">
                      <View
                        style={{
                          width: 130,
                          height: 130,
                          backgroundColor: "#171717",
                        }}
                      >
                        <Image
                          source={ev.bannerUrl}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                        <View
                          className={
                            entry
                              ? "absolute left-2 top-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5"
                              : "absolute left-2 top-2 rounded-md border border-brand/40 bg-brand/10 px-2 py-0.5"
                          }
                        >
                          <Text
                            className={
                              entry
                                ? "text-[10px] uppercase text-emerald-300"
                                : "text-[10px] uppercase text-brand"
                            }
                          >
                            {entry ? "Submitted" : "Open"}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-1 gap-1 p-3">
                        <Text
                          className="text-sm font-semibold text-neutral-100"
                          numberOfLines={2}
                        >
                          {ev.title}
                        </Text>
                        <Text className="text-xs text-brand">
                          {gameMap.get(ev.gameId)?.shortName}
                        </Text>
                        <View className="flex-row items-center gap-3">
                          <View className="flex-row items-center gap-1">
                            <Calendar size={11} color="#A3A3A3" />
                            <Text className="text-[11px] text-neutral-400">
                              {formatDate(ev.startsAt, {
                                month: "short",
                                day: "numeric",
                              })}
                            </Text>
                          </View>
                          <View className="flex-row items-center gap-1">
                            <MapPin size={11} color="#A3A3A3" />
                            <Text className="text-[11px] text-neutral-400">
                              {ev.region ?? "—"}
                            </Text>
                          </View>
                        </View>
                        <View className="mt-auto flex-row items-center gap-1">
                          <Trophy size={13} color="#FCD34D" />
                          <Text className="text-xs font-medium text-amber-300">
                            8-team bracket · 7 picks
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}
