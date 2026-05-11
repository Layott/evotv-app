import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { Sparkles } from "lucide-react-native";

import { createLeague, scoringLabel, type ScoringSystem } from "@/lib/mock/fantasy";
import { listGames } from "@/lib/api/games";
import { useMockAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CoinPill } from "@/components/engagement/coin-pill";
import { cn } from "@/lib/utils";

const SCORING_OPTIONS: ScoringSystem[] = ["kills", "kda", "objectives"];

export default function NewFantasyLeagueScreen() {
  const router = useRouter();
  const { user } = useMockAuth();
  const userId = user?.id ?? "user_current";

  const games = useQuery({ queryKey: ["games"], queryFn: () => listGames() });

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [gameId, setGameId] = React.useState("");
  const [maxMembers, setMaxMembers] = React.useState("20");
  const [entryFee, setEntryFee] = React.useState("200");
  const [salaryCap, setSalaryCap] = React.useState("25000");
  const [scoringSystem, setScoringSystem] = React.useState<ScoringSystem>("kda");
  const [endsInDays, setEndsInDays] = React.useState("14");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!gameId && (games.data?.length ?? 0) > 0) {
      setGameId(games.data![0]!.id);
    }
  }, [games.data, gameId]);

  const maxMembersN = Math.max(2, Number(maxMembers) || 2);
  const entryFeeN = Math.max(0, Number(entryFee) || 0);
  const salaryCapN = Math.max(5000, Number(salaryCap) || 5000);
  const endsInDaysN = Math.max(1, Number(endsInDays) || 1);

  const disabled =
    !name.trim() ||
    !gameId ||
    maxMembersN < 2 ||
    salaryCapN < 5000 ||
    endsInDaysN < 1;

  async function onSubmit() {
    if (disabled) return;
    setSubmitting(true);
    const endsAt = new Date(
      Date.now() + endsInDaysN * 86_400_000,
    ).toISOString();
    const lg = await createLeague({
      name,
      description,
      gameId,
      maxMembers: maxMembersN,
      entryFee: entryFeeN,
      salaryCap: salaryCapN,
      scoringSystem,
      endsAt,
      ownerId: userId,
    });
    setSubmitting(false);
    toast.success(`League "${lg.name}" created!`);
    router.replace(`/fantasy/leagues/${lg.id}`);
  }

  return (
    <>
      <Stack.Screen options={{ title: "Create League" }} />
      <ScrollView className="flex-1 bg-background">
        <View className="px-4 py-5">
          <View className="flex-row items-center gap-2">
            <Sparkles size={22} color="#7DD3FC" />
            <Text className="text-2xl font-bold text-neutral-50">
              Create a fantasy league
            </Text>
          </View>
          <Text className="mt-1 text-sm text-neutral-400">
            Configure your league. Members pay an entry fee that funds the prize.
          </Text>

          <View className="mt-5 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
            <Text className="text-xs font-medium text-neutral-300">
              League name
            </Text>
            <Input
              className="mt-1 border-neutral-800 bg-neutral-900"
              placeholder="Lagos Free Fire Friday"
              value={name}
              onChangeText={setName}
            />

            <Text className="mt-4 text-xs font-medium text-neutral-300">
              Description
            </Text>
            <Input
              className="mt-1 h-20 border-neutral-800 bg-neutral-900"
              placeholder="What's the vibe? Who should join?"
              value={description}
              onChangeText={setDescription}
              multiline
              style={{ textAlignVertical: "top" }}
            />

            <Text className="mt-4 text-xs font-medium text-neutral-300">Game</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-2"
            >
              {(games.data ?? []).map((g) => (
                <Pressable
                  key={g.id}
                  onPress={() => setGameId(g.id)}
                  className={cn(
                    "mr-2 rounded-full border px-3 py-1.5",
                    gameId === g.id
                      ? "border-brand/50 bg-brand/10"
                      : "border-neutral-800 bg-neutral-900",
                  )}
                >
                  <Text
                    className={cn(
                      "text-xs font-medium",
                      gameId === g.id ? "text-brand" : "text-neutral-400",
                    )}
                  >
                    {g.shortName}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text className="mt-4 text-xs font-medium text-neutral-300">
              Scoring
            </Text>
            <View className="mt-2 gap-2">
              {SCORING_OPTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setScoringSystem(s)}
                  className={cn(
                    "rounded-md border p-3",
                    scoringSystem === s
                      ? "border-brand/60 bg-brand/10"
                      : "border-neutral-800 bg-neutral-950",
                  )}
                >
                  <Text className="text-sm font-semibold text-neutral-100">
                    {scoringLabel(s)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="mt-4 flex-row gap-3">
              <View className="flex-1">
                <Text className="text-xs font-medium text-neutral-300">
                  Max members
                </Text>
                <Input
                  className="mt-1 border-neutral-800 bg-neutral-900"
                  keyboardType="numeric"
                  value={maxMembers}
                  onChangeText={setMaxMembers}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-medium text-neutral-300">
                  Ends in (days)
                </Text>
                <Input
                  className="mt-1 border-neutral-800 bg-neutral-900"
                  keyboardType="numeric"
                  value={endsInDays}
                  onChangeText={setEndsInDays}
                />
              </View>
            </View>

            <View className="mt-4 flex-row gap-3">
              <View className="flex-1">
                <Text className="text-xs font-medium text-neutral-300">
                  Entry fee (coins)
                </Text>
                <Input
                  className="mt-1 border-neutral-800 bg-neutral-900"
                  keyboardType="numeric"
                  value={entryFee}
                  onChangeText={setEntryFee}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-medium text-neutral-300">
                  Salary cap
                </Text>
                <Input
                  className="mt-1 border-neutral-800 bg-neutral-900"
                  keyboardType="numeric"
                  value={salaryCap}
                  onChangeText={setSalaryCap}
                />
              </View>
            </View>

            <View className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-amber-200">
                  Estimated prize pool
                </Text>
                <CoinPill coins={entryFeeN * maxMembersN} tone="amber" />
              </View>
              <Text className="mt-1 text-[11px] text-amber-200/70">
                Entry fee × max members.
              </Text>
            </View>

            <View className="mt-4 flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1 border-neutral-800 bg-neutral-900"
                onPress={() => router.back()}
                textClassName="text-neutral-200"
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-brand"
                disabled={disabled || submitting}
                onPress={onSubmit}
                textClassName="text-black"
              >
                {submitting ? "Creating…" : "Create league"}
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
