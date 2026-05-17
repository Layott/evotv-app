import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Sparkles, Trophy, Users } from "lucide-react-native";

import { scoringLabel } from "@/lib/mock/fantasy";
import {
  listLeagues,
  type FantasyLeagueRow as FantasyLeague,
} from "@/lib/api/fantasy";
import { listGames } from "@/lib/api/games";
import { eventBanner } from "@/lib/mock/_media";
import { useMockAuth } from "@/components/providers";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CoinPill } from "@/components/engagement/coin-pill";

function LeagueCard({
  league,
  gameName,
  isMember,
  onPress,
}: {
  league: FantasyLeague;
  gameName?: string;
  isMember?: boolean;
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
          source={eventBanner(league.bannerSeed)}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        <View className="absolute inset-0 bg-black/40" />
        {isMember ? (
          <View className="absolute right-2 top-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5">
            <Text className="text-[10px] uppercase text-emerald-300">
              Joined
            </Text>
          </View>
        ) : null}
      </View>
      <View className="gap-1.5 p-3">
        <View className="flex-row items-center gap-2">
          <View className="rounded-md border border-brand/30 bg-brand/10 px-2 py-0.5">
            <Text className="text-[10px] uppercase text-brand">
              {league.status}
            </Text>
          </View>
          {gameName ? (
            <Text className="text-[10px] uppercase tracking-wider text-brand">
              {gameName}
            </Text>
          ) : null}
        </View>
        <Text
          className="text-sm font-semibold text-neutral-100"
          numberOfLines={2}
        >
          {league.name}
        </Text>
        <Text className="text-[11px] text-neutral-400" numberOfLines={2}>
          {league.description}
        </Text>
        <View className="mt-1 flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <Users size={11} color="#A3A3A3" />
            <Text className="text-[11px] text-neutral-400">
              {league.members.length} / {league.maxMembers}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Trophy size={11} color="#FCD34D" />
            <CoinPill coins={league.prizePool} tone="amber" />
          </View>
        </View>
        <Text className="text-[10px] text-neutral-500">
          {scoringLabel(league.scoringSystem)} · entry{" "}
          {league.entryFee.toLocaleString()} coins
        </Text>
      </View>
    </Pressable>
  );
}

function SkeletonGrid() {
  return (
    <View className="gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-56 rounded-xl" />
      ))}
    </View>
  );
}

export default function FantasyScreen() {
  const router = useRouter();
  const { user } = useMockAuth();
  const userId = user?.id ?? "user_current";

  const all = useQuery({ queryKey: ["fantasy", "all"], queryFn: () => listLeagues() });
  const games = useQuery({ queryKey: ["games"], queryFn: () => listGames() });
  const gameMap = new Map((games.data ?? []).map((g) => [g.id, g]));

  const list = all.data ?? [];
  const mine = list.filter((l) => l.members.includes(userId));
  const discover = list.filter((l) => !l.members.includes(userId));

  return (
    <>
      <Stack.Screen options={{ title: "Fantasy" }} />
      <ScrollView className="flex-1 bg-background">
        <View className="px-4 py-5">
          <View className="flex-row items-end justify-between">
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Trophy size={22} color="#FCD34D" />
                <Text className="text-2xl font-bold text-neutral-50">
                  Fantasy Esports
                </Text>
              </View>
              <Text className="mt-1 text-sm text-neutral-400">
                Build a 5-player roster under the cap. Climb the leaderboards.
              </Text>
            </View>
            <Button
              size="sm"
              className="bg-brand"
              onPress={() => router.push("/fantasy/leagues/new")}
              textClassName="text-black"
            >
              <Plus size={14} color="#000" /> Create
            </Button>
          </View>

          <Tabs
            className="mt-5"
            defaultValue={mine.length > 0 ? "mine" : "discover"}
          >
            <TabsList>
              <TabsTrigger value="mine">
                <Text className="text-sm font-medium text-neutral-300">
                  My Leagues ({mine.length})
                </Text>
              </TabsTrigger>
              <TabsTrigger value="discover">
                <Text className="text-sm font-medium text-neutral-300">
                  Discover ({discover.length})
                </Text>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mine">
              {all.isPending ? (
                <SkeletonGrid />
              ) : mine.length === 0 ? (
                <View className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-8">
                  <View className="items-center">
                    <Sparkles size={32} color="#525252" />
                  </View>
                  <Text className="mt-3 text-center text-sm font-semibold text-neutral-200">
                    You aren't in any leagues yet.
                  </Text>
                  <Text className="mt-1 text-center text-xs text-neutral-500">
                    Discover one or spin up your own.
                  </Text>
                  <Button
                    className="mt-4 bg-brand"
                    onPress={() => router.push("/fantasy/leagues/new")}
                    textClassName="text-black"
                  >
                    <Plus size={14} color="#000" /> Create league
                  </Button>
                </View>
              ) : (
                <View className="gap-3">
                  {mine.map((l) => (
                    <LeagueCard
                      key={l.id}
                      league={l}
                      gameName={gameMap.get(l.gameId)?.shortName}
                      isMember
                      onPress={() => router.push(`/fantasy/leagues/${l.id}`)}
                    />
                  ))}
                </View>
              )}
            </TabsContent>

            <TabsContent value="discover">
              {all.isPending ? (
                <SkeletonGrid />
              ) : discover.length === 0 ? (
                <View className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-8">
                  <Text className="text-center text-sm font-semibold text-neutral-200">
                    No leagues to discover right now.
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {discover.map((l) => (
                    <LeagueCard
                      key={l.id}
                      league={l}
                      gameName={gameMap.get(l.gameId)?.shortName}
                      onPress={() => router.push(`/fantasy/leagues/${l.id}`)}
                    />
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
