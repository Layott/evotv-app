import * as React from "react";
import { ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";
import {
  Calendar,
  Crown,
  Plus,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react-native";

import {
  getLineup,
  getLeagueById,
  joinLeague,
  listActivityForLeague,
  listLeagueLeaderboard,
  scoringLabel,
  type FantasyActivityItem,
} from "@/lib/mock/fantasy";
import { listGames } from "@/lib/mock/games";
import { eventBanner } from "@/lib/mock/_media";
import { useMockAuth } from "@/components/providers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CoinPill, formatCoins } from "@/components/engagement/coin-pill";

function StatRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-1.5">
      {icon}
      <Text className="text-[11px] text-neutral-500">{label}:</Text>
      <Text className="text-[11px] font-semibold text-neutral-200">{value}</Text>
    </View>
  );
}

function ActivityIcon({ kind }: { kind: FantasyActivityItem["kind"] }) {
  if (kind === "join") {
    return (
      <View className="h-7 w-7 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
        <UserPlus size={13} color="#34D399" />
      </View>
    );
  }
  if (kind === "lineup") {
    return (
      <View className="h-7 w-7 items-center justify-center rounded-full border border-brand/30 bg-brand/10">
        <Sparkles size={13} color="#7DD3FC" />
      </View>
    );
  }
  return (
    <View className="h-7 w-7 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
      <Trophy size={13} color="#FCD34D" />
    </View>
  );
}

export default function FantasyLeagueScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const leagueId = id ?? "";
  const { user } = useMockAuth();
  const userId = user?.id ?? "user_current";
  const [refreshKey, setRefreshKey] = React.useState(0);

  const league = useQuery({
    queryKey: ["fantasy", "league", leagueId, refreshKey],
    queryFn: () => getLeagueById(leagueId),
  });
  const games = useQuery({ queryKey: ["games"], queryFn: () => listGames() });
  const standings = useQuery({
    queryKey: ["fantasy", "standings", leagueId, refreshKey],
    queryFn: () => listLeagueLeaderboard(leagueId),
  });
  const activity = useQuery({
    queryKey: ["fantasy", "activity", leagueId, refreshKey],
    queryFn: () => listActivityForLeague(leagueId, 8),
  });
  const myLineup = useQuery({
    queryKey: ["fantasy", "lineup", leagueId, userId, refreshKey],
    queryFn: () => getLineup(leagueId, userId),
  });

  const lg = league.data;
  const gameName = (games.data ?? []).find((g) => g.id === lg?.gameId)?.shortName;
  const isMember = lg?.members.includes(userId) ?? false;

  async function onJoin() {
    const res = await joinLeague(leagueId, userId);
    if (res.ok) {
      toast.success("Joined the league!");
      setRefreshKey((k) => k + 1);
    } else {
      toast.error(res.error);
    }
  }

  if (league.isPending || !lg) {
    return (
      <>
        <Stack.Screen options={{ title: "League" }} />
        <View className="flex-1 bg-background p-4">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="mt-3 h-32 rounded-xl" />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: lg.name }} />
      <ScrollView className="flex-1 bg-background">
        <View
          style={{ aspectRatio: 3, backgroundColor: "#171717" }}
          className="overflow-hidden"
        >
          <Image
            source={eventBanner(lg.bannerSeed)}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
          <View className="absolute inset-0 bg-black/40" />
        </View>
        <View className="px-4 py-4">
          <View className="flex-row flex-wrap items-center gap-2">
            <View className="rounded-md border border-brand/30 bg-brand/10 px-2 py-0.5">
              <Text className="text-[10px] uppercase text-brand">
                {lg.status}
              </Text>
            </View>
            {gameName ? (
              <Text className="text-[10px] uppercase tracking-wider text-brand">
                {gameName}
              </Text>
            ) : null}
            <Text className="text-[10px] uppercase tracking-wider text-neutral-400">
              {scoringLabel(lg.scoringSystem)}
            </Text>
          </View>
          <Text className="mt-2 text-xl font-bold text-neutral-50">
            {lg.name}
          </Text>
          {lg.description ? (
            <Text className="mt-1 text-sm text-neutral-400">
              {lg.description}
            </Text>
          ) : null}
          <View className="mt-3 flex-row flex-wrap gap-3">
            <StatRow
              icon={<Users size={13} color="#A3A3A3" />}
              label="Members"
              value={`${lg.members.length} / ${lg.maxMembers}`}
            />
            <StatRow
              icon={<Calendar size={13} color="#A3A3A3" />}
              label="Ends"
              value={new Date(lg.endsAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            />
            <StatRow
              icon={<Trophy size={13} color="#FCD34D" />}
              label="Prize"
              value={formatCoins(lg.prizePool)}
            />
            <StatRow
              icon={<Sparkles size={13} color="#A3A3A3" />}
              label="Entry"
              value={formatCoins(lg.entryFee)}
            />
          </View>

          {/* Action strip */}
          <View className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
            {isMember ? (
              <View className="flex-row items-center gap-1.5">
                <ShieldCheck size={14} color="#34D399" />
                <Text className="text-xs text-emerald-300">
                  You're in this league.
                </Text>
              </View>
            ) : (
              <Text className="text-xs text-neutral-400">
                Join the league to submit a lineup.
              </Text>
            )}
            <View className="mt-3 flex-row gap-2">
              {!isMember ? (
                <Button
                  size="sm"
                  className="flex-1 bg-brand"
                  onPress={onJoin}
                  textClassName="text-black"
                >
                  <UserPlus size={14} color="#000" />
                  Join ({lg.entryFee} coins)
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="flex-1 bg-brand"
                  onPress={() => router.push(`/fantasy/leagues/${leagueId}/lineup`)}
                  textClassName="text-black"
                >
                  <Plus size={14} color="#000" />
                  {myLineup.data ? "Edit lineup" : "Build lineup"}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-neutral-700"
                onPress={() =>
                  router.push(`/fantasy/leagues/${leagueId}/leaderboard`)
                }
                textClassName="text-neutral-200"
              >
                <Crown size={14} color="#FCD34D" />
                Leaderboard
              </Button>
            </View>
          </View>

          {/* Standings preview */}
          <Text className="mt-5 text-base font-semibold text-neutral-100">
            Standings
          </Text>
          <View className="mt-2 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/40">
            {standings.isPending
              ? Array.from({ length: 5 }).map((_, i) => (
                  <View
                    key={i}
                    className="border-b border-neutral-800/60 px-3 py-2.5"
                  >
                    <Skeleton className="h-9" />
                  </View>
                ))
              : (standings.data ?? []).slice(0, 8).map((entry) => {
                  const isMe = entry.userId === userId;
                  return (
                    <View
                      key={`${entry.userId}_${entry.rank}`}
                      className={
                        isMe
                          ? "flex-row items-center border-b border-neutral-800/60 bg-brand/10 px-3 py-2.5 last:border-0"
                          : "flex-row items-center border-b border-neutral-800/60 px-3 py-2.5 last:border-0"
                      }
                    >
                      <Text
                        className="text-sm font-medium tabular-nums text-neutral-400"
                        style={{ width: 36 }}
                      >
                        #{entry.rank}
                      </Text>
                      <View className="min-w-0 flex-1 flex-row items-center gap-2">
                        <Avatar className="h-7 w-7">
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
                        </Text>
                      </View>
                      <Text className="text-right text-sm font-semibold tabular-nums text-amber-300">
                        {entry.totalPoints.toLocaleString()} pts
                      </Text>
                    </View>
                  );
                })}
          </View>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => router.push(`/fantasy/leagues/${leagueId}/leaderboard`)}
            textClassName="text-brand"
          >
            See full leaderboard →
          </Button>

          {/* Activity */}
          <Text className="mt-3 text-base font-semibold text-neutral-100">
            Recent activity
          </Text>
          <View className="mt-2 rounded-xl border border-neutral-800 bg-neutral-900/40">
            {activity.isPending ? (
              Array.from({ length: 5 }).map((_, i) => (
                <View key={i} className="border-b border-neutral-800/60 p-3">
                  <Skeleton className="h-4 w-3/4" />
                </View>
              ))
            ) : (activity.data ?? []).length === 0 ? (
              <View className="p-4">
                <Text className="text-center text-xs text-neutral-500">
                  No activity yet.
                </Text>
              </View>
            ) : (
              (activity.data ?? []).map((a) => (
                <View
                  key={a.id}
                  className="flex-row items-start gap-3 border-b border-neutral-800/60 p-3 last:border-0"
                >
                  <ActivityIcon kind={a.kind} />
                  <View className="min-w-0 flex-1">
                    <Text className="text-xs text-neutral-200" numberOfLines={2}>
                      {a.message}
                    </Text>
                    <Text className="text-[10px] text-neutral-500">
                      {new Date(a.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
