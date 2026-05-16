import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Users } from "lucide-react-native";

import { Skeleton } from "@/components/ui/skeleton";
import { listGames } from "@/lib/api/games";
import { listTeams } from "@/lib/api/teams";
import type { Team } from "@/lib/types";

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function TeamCard({ team }: { team: Team }) {
  const router = useRouter();
  const winRate =
    team.wins + team.losses === 0
      ? 0
      : Math.round((team.wins / (team.wins + team.losses)) * 100);
  return (
    <Pressable
      onPress={() => router.push(`/team/${team.slug}`)}
      className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3 active:opacity-80"
    >
      <Image
        source={team.logoUrl}
        style={{
          width: 56,
          height: 56,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: "#262626",
        }}
        contentFit="cover"
      />
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-2">
          <Text
            className="flex-shrink text-sm font-semibold text-foreground"
            numberOfLines={1}
          >
            {team.name}
          </Text>
          <View
            className="rounded px-1.5 py-0.5"
            style={{ backgroundColor: "#262626" }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "600",
                letterSpacing: 1,
                color: "#67e8f9",
              }}
            >
              {team.tag}
            </Text>
          </View>
        </View>
        <Text
          style={{ fontSize: 11, color: "#a3a3a3", marginTop: 2 }}
        >
          {team.country} · {team.region}
        </Text>
        <View className="mt-1 flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <Trophy size={11} color="#fcd34d" />
            <Text style={{ fontSize: 11, color: "#fcd34d" }}>
              #{team.ranking}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Users size={11} color="#a3a3a3" />
            <Text style={{ fontSize: 11, color: "#a3a3a3" }}>
              {formatFollowers(team.followers)}
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: "#67e8f9" }}>
            {team.wins}-{team.losses} · {winRate}%
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function TeamsScreen() {
  const router = useRouter();
  const games = useQuery({ queryKey: ["games"], queryFn: () => listGames() });
  const teams = useQuery({ queryKey: ["teams"], queryFn: () => listTeams() });

  const grouped = new Map<string, Team[]>();
  for (const t of teams.data ?? []) {
    if (!grouped.has(t.gameId)) grouped.set(t.gameId, []);
    grouped.get(t.gameId)!.push(t);
  }

  return (
    <>
      <Stack.Screen options={{ title: "Teams" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        <View className="mb-6">
          <Text className="text-2xl font-bold tracking-tight text-foreground">
            Teams
          </Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            Esports organizations across every supported game on EVO TV.
          </Text>
        </View>

        {teams.isPending || games.isPending ? (
          <View className="gap-4">
            <Skeleton style={{ height: 80, borderRadius: 12 }} />
            <Skeleton style={{ height: 80, borderRadius: 12 }} />
            <Skeleton style={{ height: 80, borderRadius: 12 }} />
          </View>
        ) : (teams.data ?? []).length === 0 ? (
          <View className="rounded-xl border border-border bg-card p-8">
            <Text className="text-center text-sm text-muted-foreground">
              No teams available yet.
            </Text>
          </View>
        ) : (
          <View className="gap-8">
            {(games.data ?? []).map((g) => {
              const list = grouped.get(g.id) ?? [];
              if (list.length === 0) return null;
              const sorted = [...list].sort((a, b) => a.ranking - b.ranking);
              return (
                <View key={g.id} className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xl font-semibold tracking-tight text-foreground">
                      {g.name}
                    </Text>
                    <Pressable
                      onPress={() => router.push(`/categories/${g.slug}`)}
                      className="active:opacity-70"
                    >
                      <Text style={{ fontSize: 11, color: "#67e8f9" }}>
                        See all
                      </Text>
                    </Pressable>
                  </View>
                  <View className="gap-4">
                    {sorted.map((t) => (
                      <TeamCard key={t.id} team={t} />
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </>
  );
}
