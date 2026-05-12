import * as React from "react";
import { ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Crown } from "lucide-react-native";

import { listLeagueLeaderboardForEvent } from "@/lib/api/pickem";
import { getEventById } from "@/lib/api/events";
import { useMockAuth } from "@/components/providers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { RankBadge } from "@/components/engagement/rank-badge";
import { cn } from "@/lib/utils";

export default function PickemLeaderboardScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const evId = eventId ?? "";
  const { user } = useMockAuth();
  const userId = user?.id ?? "user_current";

  const board = useQuery({
    queryKey: ["pickem", "leaderboard", evId],
    queryFn: () => listLeagueLeaderboardForEvent(evId),
  });
  const event = useQuery({
    queryKey: ["pickem", "event", evId],
    queryFn: () => getEventById(evId),
  });

  const list = board.data ?? [];
  const groupCounts = new Map<number, number>();
  for (const e of list)
    groupCounts.set(e.score, (groupCounts.get(e.score) ?? 0) + 1);

  return (
    <>
      <Stack.Screen options={{ title: "Leaderboard" }} />
      <ScrollView className="flex-1 bg-background">
        <View className="px-4 py-5">
          <View className="flex-row items-center gap-2">
            <Crown size={22} color="#FCD34D" />
            <Text className="text-2xl font-bold text-neutral-50">
              Bracket Leaderboard
            </Text>
          </View>
          <Text className="mt-1 text-sm text-neutral-400">
            {event.data?.title ?? "Event"} · 10 points per correct pick
          </Text>

          <View className="mt-5 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/40">
            <View className="flex-row items-center border-b border-neutral-800 bg-neutral-900/60 px-3 py-2">
              <Text
                className="text-[10px] uppercase tracking-wider text-neutral-500"
                style={{ width: 36 }}
              >
                Rank
              </Text>
              <Text className="flex-1 text-[10px] uppercase tracking-wider text-neutral-500">
                Player
              </Text>
              <Text
                className="text-right text-[10px] uppercase tracking-wider text-neutral-500"
                style={{ width: 56 }}
              >
                Correct
              </Text>
              <Text
                className="text-right text-[10px] uppercase tracking-wider text-neutral-500"
                style={{ width: 56 }}
              >
                Score
              </Text>
            </View>

            {board.isPending
              ? Array.from({ length: 10 }).map((_, i) => (
                  <View
                    key={i}
                    className="border-b border-neutral-800/60 px-3 py-3"
                  >
                    <Skeleton className="h-9 w-full" />
                  </View>
                ))
              : list.length === 0
                ? (
                  <View className="px-4 py-10">
                    <Text className="text-center text-sm text-neutral-500">
                      No entries yet.
                    </Text>
                  </View>
                )
                : list.slice(0, 50).map((entry) => {
                    const isMe = entry.userId === userId;
                    const isTied =
                      (groupCounts.get(entry.score) ?? 0) > 1;
                    return (
                      <View
                        key={`${entry.userId}_${entry.rank}`}
                        className={cn(
                          "flex-row items-center border-b border-neutral-800/60 px-3 py-2.5 last:border-0",
                          isMe && "bg-brand/10",
                        )}
                      >
                        <View style={{ width: 36 }}>
                          <RankBadge rank={entry.rank} />
                        </View>
                        <View className="min-w-0 flex-1 flex-row items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={entry.avatarUrl} />
                            <AvatarFallback>
                              {entry.handle.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <View className="min-w-0 flex-1">
                            <View className="flex-row items-center gap-1">
                              <Text
                                className={cn(
                                  "text-sm",
                                  isMe
                                    ? "text-brand font-semibold"
                                    : "text-neutral-100",
                                )}
                                numberOfLines={1}
                              >
                                @{entry.handle}
                              </Text>
                              {isMe ? (
                                <Text className="text-[10px] uppercase text-brand">
                                  you
                                </Text>
                              ) : null}
                              {isTied ? (
                                <Text className="rounded-full border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 text-[9px] uppercase text-neutral-400">
                                  Tied
                                </Text>
                              ) : null}
                            </View>
                            <Text className="text-[10px] text-neutral-500">
                              {entry.correctPicks} of {entry.totalPicks} correct
                            </Text>
                          </View>
                        </View>
                        <Text
                          className="text-right text-sm tabular-nums text-neutral-300"
                          style={{ width: 56 }}
                        >
                          {entry.correctPicks}
                        </Text>
                        <Text
                          className={cn(
                            "text-right text-sm font-semibold tabular-nums",
                            entry.rank <= 3 ? "text-amber-300" : "text-neutral-100",
                          )}
                          style={{ width: 56 }}
                        >
                          {entry.score}
                        </Text>
                      </View>
                    );
                  })}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
