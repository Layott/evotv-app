import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, Crown } from "lucide-react-native";

import { getLeagueById, listLeagueLeaderboard } from "@/lib/mock/fantasy";
import { useMockAuth } from "@/components/providers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { RankBadge } from "@/components/engagement/rank-badge";
import { cn } from "@/lib/utils";

type SortKey = "rank" | "points" | "handle";

export default function FantasyLeaderboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const leagueId = id ?? "";
  const { user } = useMockAuth();
  const userId = user?.id ?? "user_current";
  const [sort, setSort] = React.useState<SortKey>("rank");
  const [dir, setDir] = React.useState<"asc" | "desc">("asc");

  const league = useQuery({
    queryKey: ["fantasy", "league", leagueId],
    queryFn: () => getLeagueById(leagueId),
  });
  const board = useQuery({
    queryKey: ["fantasy", "leaderboard", leagueId],
    queryFn: () => listLeagueLeaderboard(leagueId),
  });

  const list = React.useMemo(() => {
    const data = (board.data ?? []).slice();
    const mul = dir === "asc" ? 1 : -1;
    if (sort === "rank") data.sort((a, b) => mul * (a.rank - b.rank));
    if (sort === "points")
      data.sort((a, b) => mul * (b.totalPoints - a.totalPoints));
    if (sort === "handle")
      data.sort((a, b) => mul * a.handle.localeCompare(b.handle));
    return data;
  }, [board.data, sort, dir]);

  function toggleSort(key: SortKey) {
    if (sort === key) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSort(key);
      setDir(key === "rank" ? "asc" : "desc");
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: "Leaderboard" }} />
      <ScrollView className="flex-1 bg-background">
        <View className="px-4 py-5">
          <View className="flex-row items-center gap-2">
            <Crown size={22} color="#FCD34D" />
            <Text className="text-2xl font-bold text-neutral-50">Leaderboard</Text>
          </View>
          <Text className="mt-1 text-sm text-neutral-400">
            {league.data?.name ?? "Fantasy league"}
          </Text>

          <View className="mt-5 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/40">
            <View className="flex-row items-center border-b border-neutral-800 bg-neutral-900/60 px-3 py-2">
              <Pressable
                onPress={() => toggleSort("rank")}
                className="flex-row items-center gap-1"
                style={{ width: 50 }}
              >
                <Text className="text-[10px] uppercase tracking-wider text-neutral-500">
                  Rank
                </Text>
                <ArrowUpDown size={11} color="#A3A3A3" />
              </Pressable>
              <Pressable
                onPress={() => toggleSort("handle")}
                className="flex-1 flex-row items-center gap-1"
              >
                <Text className="text-[10px] uppercase tracking-wider text-neutral-500">
                  Player
                </Text>
                <ArrowUpDown size={11} color="#A3A3A3" />
              </Pressable>
              <Pressable
                onPress={() => toggleSort("points")}
                className="flex-row items-center justify-end gap-1"
                style={{ width: 100 }}
              >
                <Text className="text-[10px] uppercase tracking-wider text-neutral-500">
                  Points
                </Text>
                <ArrowUpDown size={11} color="#A3A3A3" />
              </Pressable>
            </View>

            {board.isPending
              ? Array.from({ length: 10 }).map((_, i) => (
                  <View
                    key={i}
                    className="border-b border-neutral-800/60 px-3 py-3"
                  >
                    <Skeleton className="h-9" />
                  </View>
                ))
              : list.length === 0
                ? (
                  <View className="px-4 py-10">
                    <Text className="text-center text-sm text-neutral-500">
                      No standings yet.
                    </Text>
                  </View>
                )
                : list.map((entry) => {
                    const isMe = entry.userId === userId;
                    return (
                      <View
                        key={`${entry.userId}_${entry.rank}`}
                        className={cn(
                          "flex-row items-center border-b border-neutral-800/60 px-3 py-2.5 last:border-0",
                          isMe && "bg-brand/10",
                        )}
                      >
                        <View style={{ width: 50 }}>
                          <RankBadge rank={entry.rank} />
                        </View>
                        <View className="min-w-0 flex-1 flex-row items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={entry.avatarUrl} />
                            <AvatarFallback>
                              {entry.handle.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <Text
                            className={
                              isMe
                                ? "text-sm font-semibold text-brand"
                                : "text-sm text-neutral-200"
                            }
                            numberOfLines={1}
                          >
                            @{entry.handle}
                            {isMe ? (
                              <Text className="text-[10px] uppercase text-brand">
                                {" "}
                                you
                              </Text>
                            ) : null}
                          </Text>
                        </View>
                        <Text
                          className={cn(
                            "text-right text-sm font-bold tabular-nums",
                            entry.rank <= 3 ? "text-amber-300" : "text-neutral-100",
                          )}
                          style={{ width: 100 }}
                        >
                          {entry.totalPoints.toLocaleString()} pts
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
