import * as React from "react";
import { ScrollView, Text, View } from "react-native";
import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Crown } from "lucide-react-native";

import { listLeaderboard } from "@/lib/mock/predictions";
import { useMockAuth } from "@/components/providers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { CoinPill } from "@/components/engagement/coin-pill";
import { RankBadge } from "@/components/engagement/rank-badge";
import { cn } from "@/lib/utils";

export default function PredictionsLeaderboardScreen() {
  const { user } = useMockAuth();
  const userId = user?.id ?? "user_current";
  const board = useQuery({
    queryKey: ["predictions", "leaderboard"],
    queryFn: () => listLeaderboard(50),
  });

  const list = board.data ?? [];
  const me = list.find((e) => e.userId === userId);

  return (
    <>
      <Stack.Screen options={{ title: "Predictions Leaderboard" }} />
      <ScrollView className="flex-1 bg-background">
        <View className="px-4 py-5">
          <View className="flex-row items-center gap-2">
            <Crown size={22} color="#FCD34D" />
            <Text className="text-2xl font-bold text-neutral-50">
              Predictions Leaderboard
            </Text>
          </View>
          <Text className="mt-1 text-sm text-neutral-400">
            Top predictors by total EVO Coin balance.
          </Text>

          {me ? (
            <View className="mt-5 rounded-xl border border-brand/30 bg-brand/5 p-4">
              <Text className="text-[10px] uppercase tracking-wider text-brand">
                Your standing
              </Text>
              <View className="mt-2 flex-row items-center gap-3">
                <RankBadge rank={me.rank} />
                <Avatar className="h-9 w-9">
                  <AvatarImage src={me.avatarUrl} />
                  <AvatarFallback>
                    {me.handle.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <View className="min-w-0 flex-1">
                  <Text
                    className="text-sm font-semibold text-neutral-100"
                    numberOfLines={1}
                  >
                    @{me.handle}
                  </Text>
                  <Text className="text-xs text-neutral-400">
                    {me.totalWins} wins
                  </Text>
                </View>
                <CoinPill coins={me.totalCoins} tone="amber" />
              </View>
            </View>
          ) : null}

          <View className="mt-5 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/40">
            <View className="flex-row items-center border-b border-neutral-800 bg-neutral-900/60 px-3 py-2">
              <Text
                className="text-[10px] uppercase tracking-wider text-neutral-500"
                style={{ width: 36 }}
              >
                Rank
              </Text>
              <Text className="flex-1 text-[10px] uppercase tracking-wider text-neutral-500">
                User
              </Text>
              <Text
                className="text-right text-[10px] uppercase tracking-wider text-neutral-500"
                style={{ width: 50 }}
              >
                Wins
              </Text>
              <Text
                className="text-right text-[10px] uppercase tracking-wider text-neutral-500"
                style={{ width: 80 }}
              >
                Coins
              </Text>
            </View>
            {board.isPending ? (
              Array.from({ length: 10 }).map((_, i) => (
                <View
                  key={i}
                  className="border-b border-neutral-800/60 px-3 py-3"
                >
                  <Skeleton className="h-9" />
                </View>
              ))
            ) : list.length === 0 ? (
              <View className="px-4 py-10">
                <Text className="text-center text-sm text-neutral-500">
                  No leaderboard yet.
                </Text>
              </View>
            ) : (
              list.map((entry) => {
                const isMe = entry.userId === userId;
                return (
                  <View
                    key={entry.userId}
                    className={cn(
                      "flex-row items-center border-b border-neutral-800/60 px-3 py-2.5 last:border-0",
                      isMe && "bg-brand/5",
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
                        {isMe ? (
                          <Text className="text-[10px] uppercase text-brand">
                            {" "}
                            you
                          </Text>
                        ) : null}
                      </Text>
                    </View>
                    <Text
                      className="text-right text-sm tabular-nums text-neutral-300"
                      style={{ width: 50 }}
                    >
                      {entry.totalWins}
                    </Text>
                    <View
                      className="flex-row justify-end"
                      style={{ width: 80 }}
                    >
                      <CoinPill
                        coins={entry.totalCoins}
                        tone={entry.rank <= 3 ? "amber" : "muted"}
                      />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
