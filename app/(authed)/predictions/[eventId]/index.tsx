import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { Calendar, Coins, Lock, Trophy } from "lucide-react-native";

import {
  getCoinBalance,
  getTeamOdds,
  listOpenPredictionEvents,
  listPredictionsForEvent,
  submitPrediction,
  type Prediction,
} from "@/lib/mock/predictions";
import { getEventById, listMatchesForEvent } from "@/lib/api/events";
import { listTeams } from "@/lib/api/teams";
import { listGames } from "@/lib/api/games";
import type { Match, Team } from "@/lib/types";
import { useMockAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CoinPill, formatCoins } from "@/components/engagement/coin-pill";
import { cn } from "@/lib/utils";

const STAKES = [50, 100, 200, 500];

function MatchPickCard({
  match,
  teamA,
  teamB,
  existing,
  coinBalance,
  onSubmitted,
  userId,
}: {
  match: Match;
  teamA: Team | null;
  teamB: Team | null;
  existing: Prediction | null;
  coinBalance: number;
  onSubmitted: () => void;
  userId: string;
}) {
  const [picked, setPicked] = React.useState<string | null>(
    existing?.teamPickedId ?? null,
  );
  const [stake, setStake] = React.useState<number>(
    existing?.coinsStaked ?? 100,
  );
  const [busy, setBusy] = React.useState(false);

  const locked = match.state === "completed" || !!existing;
  const oddsA = teamA && teamB ? getTeamOdds(teamA.id, teamB.id) : 2;
  const oddsB = teamA && teamB ? getTeamOdds(teamB.id, teamA.id) : 2;

  function teamRow(team: Team | null, odds: number) {
    if (!team) return null;
    const isPicked = picked === team.id;
    return (
      <Pressable
        disabled={locked}
        onPress={() => setPicked(team.id)}
        className={cn(
          "flex-1 flex-col items-center rounded-md border p-3",
          isPicked
            ? "border-brand/60 bg-brand/10"
            : "border-neutral-800 bg-neutral-950",
          locked && "opacity-70",
        )}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            backgroundColor: "#171717",
            overflow: "hidden",
          }}
        >
          <Image
            source={team.logoUrl}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        </View>
        <Text
          className="mt-2 text-xs font-semibold text-neutral-100"
          numberOfLines={1}
        >
          {team.tag}
        </Text>
        <Text className="text-[10px] text-neutral-400">#{team.ranking}</Text>
        <Text
          className={cn(
            "mt-1 text-sm font-bold tabular-nums",
            isPicked ? "text-brand" : "text-neutral-300",
          )}
        >
          {odds.toFixed(2)}x
        </Text>
      </Pressable>
    );
  }

  async function onSubmit() {
    if (!picked) {
      toast.error("Pick a team first");
      return;
    }
    if (stake > coinBalance) {
      toast.error("Not enough coins");
      return;
    }
    setBusy(true);
    const res = await submitPrediction(match.id, picked, stake, userId);
    setBusy(false);
    if (res.ok) {
      toast.success(`Pick locked: +${res.prediction.payoutCoins} potential`);
      onSubmitted();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <View className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
      <View className="flex-row flex-wrap items-center gap-2">
        <Text className="text-[10px] uppercase tracking-wider text-neutral-500">
          {match.bestOf ? `Best of ${match.bestOf}` : "Match"}
        </Text>
        {locked ? (
          <View className="flex-row items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5">
            <Lock size={10} color="#34D399" />
            <Text className="text-[10px] uppercase text-emerald-300">
              {existing
                ? `Picked · staked ${existing.coinsStaked}`
                : "Completed"}
            </Text>
          </View>
        ) : null}
      </View>
      <View className="mt-2 flex-row items-center gap-3">
        {teamRow(teamA, oddsA)}
        <Text className="text-xs font-bold text-neutral-500">VS</Text>
        {teamRow(teamB, oddsB)}
      </View>
      {!locked ? (
        <>
          <Text className="mt-3 text-[10px] uppercase tracking-wider text-neutral-500">
            Stake
          </Text>
          <View className="mt-2 flex-row gap-2">
            {STAKES.map((s) => (
              <Pressable
                key={s}
                onPress={() => setStake(s)}
                className={cn(
                  "flex-1 rounded-md border py-2",
                  stake === s
                    ? "border-amber-500/50 bg-amber-500/10"
                    : "border-neutral-800 bg-neutral-950",
                )}
              >
                <Text
                  className={cn(
                    "text-center text-xs font-semibold",
                    stake === s ? "text-amber-300" : "text-neutral-300",
                  )}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
          <View className="mt-2 flex-row items-center justify-between">
            <Text className="text-[11px] text-neutral-400">
              Potential payout
            </Text>
            <CoinPill
              coins={Math.round(
                stake *
                  (picked === teamA?.id
                    ? oddsA
                    : picked === teamB?.id
                      ? oddsB
                      : 0),
              )}
              tone="amber"
            />
          </View>
          <Button
            size="sm"
            className="mt-3 bg-brand"
            disabled={!picked || busy || stake > coinBalance}
            onPress={onSubmit}
            textClassName="text-black"
          >
            {busy ? "Submitting…" : "Lock pick"}
          </Button>
        </>
      ) : null}
    </View>
  );
}

export default function PredictionsEventScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const evId = eventId ?? "";
  const { user } = useMockAuth();
  const userId = user?.id ?? "user_current";
  const [refreshKey, setRefreshKey] = React.useState(0);

  const event = useQuery({
    queryKey: ["predictions", "event", evId],
    queryFn: () => getEventById(evId),
  });
  const summary = useQuery({
    queryKey: ["predictions", "events"],
    queryFn: () => listOpenPredictionEvents(),
  });
  const matches = useQuery({
    queryKey: ["predictions", "matches", evId],
    queryFn: () => listMatchesForEvent(evId),
  });
  const teams = useQuery({ queryKey: ["teams"], queryFn: () => listTeams() });
  const games = useQuery({ queryKey: ["games"], queryFn: () => listGames() });
  const balance = useQuery({
    queryKey: ["predictions", "balance", userId, refreshKey],
    queryFn: () => getCoinBalance(userId),
  });
  const myPredictions = useQuery({
    queryKey: ["predictions", "my-event", evId, userId, refreshKey],
    queryFn: () => listPredictionsForEvent(evId, userId),
  });

  const ev = event.data;
  const gameName = (games.data ?? []).find((g) => g.id === ev?.gameId)?.shortName;
  const teamMap = new Map((teams.data ?? []).map((t) => [t.id, t]));
  const matchList = matches.data ?? [];
  const eventSummary = (summary.data ?? []).find((s) => s.eventId === evId);

  const onSubmitted = () => setRefreshKey((k) => k + 1);

  const totalStaked = (myPredictions.data ?? []).reduce(
    (s, p) => s + p.coinsStaked,
    0,
  );
  const totalPotential = (myPredictions.data ?? []).reduce(
    (s, p) => s + (p.status === "lost" ? 0 : p.payoutCoins),
    0,
  );

  return (
    <>
      <Stack.Screen
        options={{ title: ev?.title ?? "Predictions", headerBackTitle: "Back" }}
      />
      <ScrollView className="flex-1 bg-background">
        {event.isPending || !ev ? (
          <View className="p-4">
            <Skeleton className="h-44 rounded-xl" />
            <Skeleton className="mt-3 h-32 rounded-xl" />
          </View>
        ) : (
          <>
            <View
              style={{ aspectRatio: 3, backgroundColor: "#171717" }}
              className="overflow-hidden"
            >
              <Image
                source={ev.bannerUrl}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
              <View className="absolute inset-0 bg-black/40" />
            </View>
            <View className="px-4 py-4">
              <View className="flex-row flex-wrap items-center gap-2">
                {ev.status === "live" ? (
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
                ) : (
                  <View className="rounded-md border border-brand/30 bg-brand/10 px-2 py-0.5">
                    <Text className="text-[10px] uppercase tracking-wider text-brand">
                      Scheduled
                    </Text>
                  </View>
                )}
                {gameName ? (
                  <Text className="text-[10px] uppercase tracking-wider text-brand">
                    {gameName}
                  </Text>
                ) : null}
                <View className="flex-row items-center gap-1">
                  <Calendar size={11} color="#A3A3A3" />
                  <Text className="text-[11px] text-neutral-400">
                    {new Date(ev.startsAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
              <Text className="mt-2 text-xl font-bold text-neutral-50">
                {ev.title}
              </Text>
              <Text className="mt-1 text-sm text-neutral-400" numberOfLines={2}>
                {ev.description}
              </Text>
              <View className="mt-3 flex-row flex-wrap items-center gap-3">
                <View className="flex-row items-center gap-1.5">
                  <Trophy size={13} color="#FCD34D" />
                  <Text className="text-xs text-neutral-400">Prize pool:</Text>
                  <CoinPill
                    coins={eventSummary?.prizePoolCoins ?? 5000}
                    tone="amber"
                  />
                </View>
                <View className="flex-row items-center gap-1.5">
                  <Coins size={13} color="#FCD34D" />
                  <Text className="text-xs text-neutral-400">Balance:</Text>
                  <CoinPill coins={balance.data?.coins ?? 0} tone="muted" />
                </View>
              </View>

              {(myPredictions.data?.length ?? 0) > 0 ? (
                <View className="mt-4 flex-row gap-2">
                  <View className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
                    <Text className="text-[10px] uppercase tracking-wider text-neutral-500">
                      Picks
                    </Text>
                    <Text className="mt-1 text-base font-semibold text-neutral-100">
                      {(myPredictions.data ?? []).length}
                    </Text>
                  </View>
                  <View className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
                    <Text className="text-[10px] uppercase tracking-wider text-neutral-500">
                      Staked
                    </Text>
                    <Text className="mt-1 text-base font-semibold text-neutral-100">
                      {totalStaked.toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex-1 rounded-xl border border-amber-500/20 bg-neutral-900/60 p-3">
                    <Text className="text-[10px] uppercase tracking-wider text-neutral-500">
                      Potential
                    </Text>
                    <Text className="mt-1 text-base font-semibold text-amber-300">
                      {totalPotential.toLocaleString()}
                    </Text>
                  </View>
                </View>
              ) : null}

              <Text className="mt-5 text-base font-semibold text-neutral-100">
                Matches
              </Text>
              {matches.isPending ? (
                <View className="mt-2 gap-3">
                  <Skeleton className="h-44 rounded-xl" />
                  <Skeleton className="h-44 rounded-xl" />
                </View>
              ) : matchList.length === 0 ? (
                <View className="mt-2 rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-8">
                  <Text className="text-center text-sm text-neutral-400">
                    No matches scheduled yet.
                  </Text>
                </View>
              ) : (
                <View className="mt-2 gap-3">
                  {matchList.map((match) => {
                    const teamA = teamMap.get(match.teamAId) ?? null;
                    const teamB = teamMap.get(match.teamBId) ?? null;
                    const existing =
                      (myPredictions.data ?? []).find(
                        (p) => p.matchId === match.id,
                      ) ?? null;
                    return (
                      <MatchPickCard
                        key={match.id}
                        match={match}
                        teamA={teamA}
                        teamB={teamB}
                        existing={existing}
                        coinBalance={balance.data?.coins ?? 0}
                        onSubmitted={onSubmitted}
                        userId={userId}
                      />
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}
