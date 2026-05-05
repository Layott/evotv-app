import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { Plus, Trophy, X } from "lucide-react-native";

import {
  getLeagueById,
  getLineup,
  listAvailablePlayers,
  playerCost,
  submitLineup,
} from "@/lib/mock/fantasy";
import type { Player } from "@/lib/types";
import { useMockAuth } from "@/components/providers";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CoinPill, formatCoins } from "@/components/engagement/coin-pill";
import { cn } from "@/lib/utils";

const ROSTER_SIZE = 5;

function PlayerRow({
  player,
  picked,
  onClick,
}: {
  player: Player;
  picked: boolean;
  onClick: () => void;
}) {
  const cost = playerCost(player);
  return (
    <Pressable
      onPress={onClick}
      className={cn(
        "flex-row items-center gap-3 rounded-lg border p-2.5",
        picked
          ? "border-brand/60 bg-brand/10"
          : "border-neutral-800 bg-neutral-900/60",
      )}
    >
      <Avatar className="h-9 w-9">
        <AvatarImage src={player.avatarUrl} />
        <AvatarFallback>
          {player.handle.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text
            className="text-sm font-semibold text-neutral-100"
            numberOfLines={1}
          >
            {player.handle}
          </Text>
          <Text className="rounded bg-neutral-800 px-1.5 py-0.5 text-[9px] uppercase text-neutral-300">
            {player.role}
          </Text>
        </View>
        <Text className="text-[11px] text-neutral-400">
          KDA {player.kda.toFixed(2)} · {player.followers.toLocaleString()} followers
        </Text>
      </View>
      <View className="items-end">
        <CoinPill coins={cost} tone={picked ? "amber" : "muted"} />
        <Text
          className={cn(
            "mt-1 text-[10px] font-semibold",
            picked ? "text-brand" : "text-neutral-500",
          )}
        >
          {picked ? "Picked" : "Tap to pick"}
        </Text>
      </View>
    </Pressable>
  );
}

export default function FantasyLineupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const leagueId = id ?? "";
  const { user } = useMockAuth();
  const userId = user?.id ?? "user_current";
  const [refreshKey, setRefreshKey] = React.useState(0);

  const league = useQuery({
    queryKey: ["fantasy", "league", leagueId],
    queryFn: () => getLeagueById(leagueId),
  });
  const playersQ = useQuery({
    queryKey: ["fantasy", "available", league.data?.gameId],
    enabled: !!league.data?.gameId,
    queryFn: () => listAvailablePlayers(league.data!.gameId),
  });
  const existing = useQuery({
    queryKey: ["fantasy", "lineup", leagueId, userId, refreshKey],
    queryFn: () => getLineup(leagueId, userId),
  });

  const [search, setSearch] = React.useState("");
  const [picked, setPicked] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  React.useEffect(() => {
    if (existing.data?.players) {
      setPicked(existing.data.players.map((p) => p.playerId));
    }
  }, [existing.data?.id, existing.data?.players]);

  const lg = league.data;
  const allPlayers = playersQ.data ?? [];
  const playerById = React.useMemo(
    () => new Map(allPlayers.map((p) => [p.id, p])),
    [allPlayers],
  );
  const filtered = React.useMemo(() => {
    let list = allPlayers;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.handle.toLowerCase().includes(q) ||
          p.realName.toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => playerCost(b) - playerCost(a));
  }, [allPlayers, search]);

  const totalCost = picked.reduce(
    (sum, pid) => sum + (playerById.get(pid) ? playerCost(playerById.get(pid)!) : 0),
    0,
  );
  const remaining = (lg?.salaryCap ?? 0) - totalCost;
  const overCap = remaining < 0;
  const canSubmit = picked.length === ROSTER_SIZE && !overCap;

  function togglePick(p: Player) {
    setPicked((prev) => {
      if (prev.includes(p.id)) return prev.filter((x) => x !== p.id);
      if (prev.length >= ROSTER_SIZE) {
        toast.error(`Roster is full (${ROSTER_SIZE} players).`);
        return prev;
      }
      const cost = playerCost(p);
      const futureCost = totalCost + cost;
      if (lg && futureCost > lg.salaryCap) {
        toast.error(`Adding ${p.handle} would exceed your salary cap.`);
        return prev;
      }
      return [...prev, p.id];
    });
  }

  async function onSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    const res = await submitLineup(leagueId, picked, userId);
    setSubmitting(false);
    if (res.ok) {
      toast.success(`Lineup locked! Projected: ${res.lineup.totalPoints} pts.`);
      setRefreshKey((k) => k + 1);
    } else {
      toast.error(res.error);
    }
  }

  if (!lg) {
    return (
      <>
        <Stack.Screen options={{ title: "Lineup" }} />
        <View className="flex-1 bg-background p-4">
          <Skeleton className="h-44 rounded-xl" />
        </View>
      </>
    );
  }

  const tone = overCap ? "red" : remaining < 1500 ? "amber" : "neutral";

  return (
    <>
      <Stack.Screen options={{ title: "Build Lineup" }} />
      <ScrollView className="flex-1 bg-background">
        <View className="px-4 py-5">
          <Text className="text-xs uppercase tracking-wider text-brand">
            {lg.name}
          </Text>
          <Text className="mt-1 text-2xl font-bold text-neutral-50">
            Build your lineup
          </Text>
          <Text className="mt-1 text-sm text-neutral-400">
            Pick {ROSTER_SIZE} players under the {formatCoins(lg.salaryCap)} cap.
          </Text>

          <View className="mt-5 flex-row gap-2">
            <View className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
              <Text className="text-[10px] uppercase tracking-wider text-neutral-500">
                Roster
              </Text>
              <Text className="mt-1 text-base font-semibold text-neutral-100">
                {picked.length} / {ROSTER_SIZE}
              </Text>
            </View>
            <View className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
              <Text className="text-[10px] uppercase tracking-wider text-neutral-500">
                Cap
              </Text>
              <Text className="mt-1 text-base font-semibold text-neutral-100">
                {formatCoins(lg.salaryCap)}
              </Text>
            </View>
            <View
              className={cn(
                "flex-1 rounded-xl border bg-neutral-900/60 p-3",
                tone === "red"
                  ? "border-red-500/30"
                  : tone === "amber"
                    ? "border-amber-500/30"
                    : "border-neutral-800",
              )}
            >
              <Text className="text-[10px] uppercase tracking-wider text-neutral-500">
                {overCap ? "Over cap" : "Remaining"}
              </Text>
              <Text
                className={cn(
                  "mt-1 text-base font-semibold tabular-nums",
                  tone === "red"
                    ? "text-red-300"
                    : tone === "amber"
                      ? "text-amber-300"
                      : "text-emerald-300",
                )}
              >
                {overCap ? "-" : ""}
                {Math.abs(remaining).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Roster */}
          <View className="mt-5 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
            <View className="flex-row items-center gap-2">
              <Trophy size={16} color="#FCD34D" />
              <Text className="text-sm font-semibold text-neutral-100">
                Your roster
              </Text>
            </View>
            <View className="mt-3 gap-2">
              {Array.from({ length: ROSTER_SIZE }).map((_, slotIdx) => {
                const pid = picked[slotIdx];
                const player = pid ? playerById.get(pid) : null;
                if (!player) {
                  return (
                    <Pressable
                      key={slotIdx}
                      onPress={() => setPickerOpen(true)}
                      className="flex-row items-center gap-2 rounded-lg border border-dashed border-neutral-800 bg-neutral-900/40 px-2 py-3"
                    >
                      <View className="h-7 w-7 items-center justify-center rounded-full bg-neutral-900">
                        <Plus size={12} color="#A3A3A3" />
                      </View>
                      <Text className="text-xs text-neutral-500">
                        Slot {slotIdx + 1} — tap to add
                      </Text>
                    </Pressable>
                  );
                }
                const cost = playerCost(player);
                return (
                  <View
                    key={slotIdx}
                    className="flex-row items-center gap-2 rounded-lg border border-brand/30 bg-brand/5 px-2 py-2"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={player.avatarUrl} />
                      <AvatarFallback>
                        {player.handle.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <View className="min-w-0 flex-1">
                      <Text
                        className="text-xs font-semibold text-neutral-100"
                        numberOfLines={1}
                      >
                        {player.handle}
                      </Text>
                      <Text className="text-[10px] text-neutral-400">
                        {player.role} · KDA {player.kda.toFixed(2)}
                      </Text>
                    </View>
                    <CoinPill coins={cost} tone="muted" />
                    <Pressable
                      onPress={() =>
                        setPicked((prev) => prev.filter((x) => x !== player.id))
                      }
                      className="ml-1 p-1"
                    >
                      <X size={14} color="#A3A3A3" />
                    </Pressable>
                  </View>
                );
              })}
            </View>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 border-neutral-700"
              onPress={() => setPickerOpen(true)}
              textClassName="text-neutral-200"
            >
              <Plus size={14} color="#FAFAFA" />
              Add players
            </Button>
          </View>

          {/* Submit summary */}
          <View className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-neutral-400">Total spend</Text>
              <CoinPill coins={totalCost} tone="amber" />
            </View>
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-xs text-neutral-400">Cap remaining</Text>
              <Text
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  overCap ? "text-red-300" : "text-emerald-300",
                )}
              >
                {overCap ? "-" : ""}
                {Math.abs(remaining).toLocaleString()}
              </Text>
            </View>
            <Button
              className="mt-4 bg-brand"
              disabled={!canSubmit || submitting}
              onPress={onSubmit}
              textClassName="text-black"
            >
              {submitting
                ? "Submitting…"
                : existing.data
                  ? "Update lineup"
                  : "Submit lineup"}
            </Button>
            {!canSubmit ? (
              <Text className="mt-2 text-[10px] text-neutral-500">
                {picked.length < ROSTER_SIZE
                  ? `Pick ${ROSTER_SIZE - picked.length} more player${
                      ROSTER_SIZE - picked.length === 1 ? "" : "s"
                    }.`
                  : "Trim your roster to fit the salary cap."}
              </Text>
            ) : null}
          </View>

          {existing.data ? (
            <View className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
              <Text className="text-xs text-emerald-200">
                Last submitted lineup scored{" "}
                <Text className="font-bold">{existing.data.totalPoints} pts</Text>.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Player Picker Sheet */}
      <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
        <SheetContent side="bottom" className="max-h-[85%]">
          <SheetHeader>
            <SheetTitle>Pick players</SheetTitle>
            <Text className="text-xs text-neutral-400">
              {filtered.length} players · tap to add or remove
            </Text>
          </SheetHeader>
          <Input
            className="border-neutral-800 bg-neutral-900"
            placeholder="Search by handle or real name"
            value={search}
            onChangeText={setSearch}
          />
          <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator>
            {playersQ.isPending ? (
              <View className="gap-2 pb-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </View>
            ) : filtered.length === 0 ? (
              <Text className="py-6 text-center text-sm text-neutral-500">
                No players match your search.
              </Text>
            ) : (
              <View className="gap-2 pb-4">
                {filtered.map((p) => (
                  <PlayerRow
                    key={p.id}
                    player={p}
                    picked={picked.includes(p.id)}
                    onClick={() => togglePick(p)}
                  />
                ))}
              </View>
            )}
          </ScrollView>
          <Button
            className="mt-2 bg-brand"
            onPress={() => setPickerOpen(false)}
            textClassName="text-black"
          >
            Done
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
}
