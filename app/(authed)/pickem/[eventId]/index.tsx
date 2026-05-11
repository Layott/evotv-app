import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { Crown, Lock, Trophy } from "lucide-react-native";

import {
  deriveBracketWithPicks,
  getBracketForEvent,
  getMyEntryForEvent,
  submitPickemEntry,
  type BracketMatch,
  type BracketPick,
} from "@/lib/mock/pickem";
import { getEventById } from "@/lib/api/events";
import { listGames } from "@/lib/api/games";
import { listTeams } from "@/lib/api/teams";
import type { Team } from "@/lib/types";
import { useMockAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ROUND_LABELS: Record<BracketMatch["round"], string> = {
  quarterfinal: "Quarterfinals",
  semifinal: "Semifinals",
  final: "Final",
};

function MatchSlot({
  match,
  picks,
  teamMap,
  locked,
  onPick,
}: {
  match: BracketMatch;
  picks: BracketPick[];
  teamMap: Map<string, Team>;
  locked: boolean;
  onPick: (matchId: string, teamId: string) => void;
}) {
  const pick = picks.find((p) => p.matchId === match.id);
  const teamA = match.teamAId ? teamMap.get(match.teamAId) ?? null : null;
  const teamB = match.teamBId ? teamMap.get(match.teamBId) ?? null : null;

  function row(team: Team | null, fallbackLabel: string) {
    const teamId = team?.id ?? "";
    const picked = !!team && pick?.winnerTeamId === teamId;
    const correct =
      locked && match.truthWinnerId === teamId && pick?.winnerTeamId === teamId;
    return (
      <Pressable
        disabled={locked || !team}
        onPress={() => team && onPick(match.id, team.id)}
        className={cn(
          "flex-row items-center gap-2 rounded-md border p-2",
          picked
            ? "border-brand/60 bg-brand/10"
            : "border-neutral-800 bg-neutral-950",
          !team && "opacity-50",
          correct && "border-emerald-500/60 bg-emerald-500/10",
        )}
      >
        {team ? (
          <>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
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
            <View className="min-w-0 flex-1">
              <Text
                className="text-xs font-semibold text-neutral-100"
                numberOfLines={1}
              >
                {team.name}
              </Text>
              <Text className="text-[10px] text-neutral-500">
                #{team.ranking} · {team.tag}
              </Text>
            </View>
            {picked ? (
              <Text
                className={cn(
                  "text-[10px] font-bold uppercase",
                  correct ? "text-emerald-300" : "text-brand",
                )}
              >
                {correct ? "Correct" : "Pick"}
              </Text>
            ) : null}
          </>
        ) : (
          <Text className="text-[11px] italic text-neutral-500">
            {fallbackLabel}
          </Text>
        )}
      </Pressable>
    );
  }

  return (
    <View className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-2.5">
      <Text className="mb-1 text-[10px] uppercase tracking-wider text-neutral-500">
        {ROUND_LABELS[match.round]} · Match {match.slot + 1}
      </Text>
      <View className="gap-1.5">
        {row(teamA, "Winner of upstream A")}
        {row(teamB, "Winner of upstream B")}
      </View>
    </View>
  );
}

export default function PickemEventScreen() {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const evId = eventId ?? "";
  const { user } = useMockAuth();
  const userId = user?.id ?? "user_current";

  const [picks, setPicks] = React.useState<BracketPick[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const event = useQuery({
    queryKey: ["pickem", "event", evId],
    queryFn: () => getEventById(evId),
  });
  const teams = useQuery({ queryKey: ["teams"], queryFn: () => listTeams() });
  const games = useQuery({ queryKey: ["games"], queryFn: () => listGames() });
  const bracket = useQuery({
    queryKey: ["pickem", "bracket", evId],
    queryFn: () => getBracketForEvent(evId),
  });
  const existing = useQuery({
    queryKey: ["pickem", "my-entry", evId, userId, refreshKey],
    queryFn: () => getMyEntryForEvent(evId, userId),
  });

  React.useEffect(() => {
    if (existing.data) setPicks(existing.data.picks);
  }, [existing.data]);

  const teamMap = React.useMemo(
    () => new Map((teams.data ?? []).map((t) => [t.id, t])),
    [teams.data],
  );
  const ev = event.data;
  const gameName = (games.data ?? []).find((g) => g.id === ev?.gameId)?.shortName;

  const locked = !!existing.data;
  const totalSlots = bracket.data?.length ?? 0;
  const completed = picks.length;

  function onPick(matchId: string, teamId: string) {
    if (locked) return;
    setPicks((prev) => {
      const without = prev.filter((p) => p.matchId !== matchId);
      const next = [...without, { matchId, winnerTeamId: teamId }];
      if (!bracket.data) return next;
      const filled = deriveBracketWithPicks(bracket.data, next);
      return next.filter((p) => {
        const slot = filled.find((m) => m.id === p.matchId);
        if (!slot) return true;
        if (slot.teamAId === p.winnerTeamId || slot.teamBId === p.winnerTeamId)
          return true;
        return false;
      });
    });
  }

  async function onSubmit() {
    if (!bracket.data) return;
    if (picks.length < bracket.data.length) {
      toast.error(`Pick all ${bracket.data.length} matches before submitting.`);
      return;
    }
    setSubmitting(true);
    const res = await submitPickemEntry(evId, picks, userId);
    setSubmitting(false);
    if (res.ok) {
      toast.success(`Bracket locked! Score: ${res.entry.score} pts.`);
      setRefreshKey((k) => k + 1);
      router.push(`/pickem/${evId}/leaderboard`);
    } else {
      toast.error(res.error);
    }
  }

  const filled =
    bracket.data ? deriveBracketWithPicks(bracket.data, picks) : [];
  const finalMatch = filled.find((m) => m.round === "final");
  const championPick = picks.find((p) => p.matchId === finalMatch?.id);
  const champion = championPick ? teamMap.get(championPick.winnerTeamId) : null;

  if (event.isPending || !ev || bracket.isPending) {
    return (
      <>
        <Stack.Screen options={{ title: "Pick'em" }} />
        <View className="flex-1 bg-background p-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="mt-3 h-72 w-full rounded-xl" />
        </View>
      </>
    );
  }

  if (!ev) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-8">
        <Text className="text-lg font-bold text-neutral-200">Event not found</Text>
      </View>
    );
  }

  const grouped: Record<BracketMatch["round"], BracketMatch[]> = {
    quarterfinal: [],
    semifinal: [],
    final: [],
  };
  for (const m of filled) grouped[m.round].push(m);

  return (
    <>
      <Stack.Screen options={{ title: ev.title }} />
      <ScrollView className="flex-1 bg-background">
        {/* Hero */}
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
            <View className="rounded-md border border-brand/30 bg-brand/10 px-2 py-0.5">
              <Text className="text-[10px] uppercase tracking-wider text-brand">
                Bracket Pick'em
              </Text>
            </View>
            {gameName ? (
              <Text className="text-[10px] uppercase tracking-wider text-brand">
                {gameName}
              </Text>
            ) : null}
            {locked ? (
              <View className="flex-row items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5">
                <Lock size={10} color="#34D399" />
                <Text className="text-[10px] uppercase tracking-wider text-emerald-300">
                  Submitted · {existing.data!.score} pts
                </Text>
              </View>
            ) : null}
          </View>
          <Text className="mt-2 text-xl font-bold text-neutral-50">
            {ev.title}
          </Text>
          <Text className="mt-1 text-sm text-neutral-400" numberOfLines={2}>
            {ev.description}
          </Text>

          {/* Stats row */}
          <View className="mt-4 flex-row gap-2">
            <View className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
              <Text className="text-[10px] uppercase tracking-wider text-neutral-500">
                Picks made
              </Text>
              <Text className="mt-1 text-sm font-semibold text-neutral-100">
                {completed} / {totalSlots}
              </Text>
            </View>
            <View className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
              <Text className="text-[10px] uppercase tracking-wider text-neutral-500">
                Champion
              </Text>
              <Text
                className="mt-1 text-sm font-semibold text-neutral-100"
                numberOfLines={1}
              >
                {champion ? champion.name : "—"}
              </Text>
            </View>
            <View className="flex-1 rounded-xl border border-amber-500/20 bg-neutral-900/60 p-3">
              <Text className="text-[10px] uppercase tracking-wider text-neutral-500">
                Per correct
              </Text>
              <Text className="mt-1 text-sm font-semibold text-amber-300">
                10 pts
              </Text>
            </View>
          </View>

          {/* Bracket sections */}
          {(["quarterfinal", "semifinal", "final"] as const).map((r) => (
            <View key={r} className="mt-5">
              <Text className="text-base font-semibold text-neutral-100">
                {ROUND_LABELS[r]}
              </Text>
              <View className="mt-2 gap-2">
                {grouped[r].map((m) => (
                  <MatchSlot
                    key={m.id}
                    match={m}
                    picks={picks}
                    teamMap={teamMap}
                    locked={locked}
                    onPick={onPick}
                  />
                ))}
              </View>
            </View>
          ))}

          <View className="mt-5 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
            <Text className="text-xs text-neutral-400">
              {locked
                ? "Your bracket is locked. Watch the leaderboard for live scoring."
                : "Pick a winner for every match. Once submitted you cannot change picks."}
            </Text>
            <View className="mt-3 flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-neutral-800 bg-neutral-900"
                onPress={() => router.push(`/pickem/${evId}/leaderboard`)}
                textClassName="text-neutral-200"
              >
                <Crown size={14} color="#FCD34D" />
                Leaderboard
              </Button>
              {!locked ? (
                <Button
                  size="sm"
                  className="flex-1 bg-brand"
                  disabled={submitting || completed < totalSlots}
                  onPress={onSubmit}
                  textClassName="text-black"
                >
                  <Trophy size={14} color="#000" />
                  {submitting
                    ? "Submitting…"
                    : `Submit (${completed}/${totalSlots})`}
                </Button>
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
