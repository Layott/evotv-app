import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Calendar,
  MapPin,
  Trophy,
  Users,
} from "lucide-react-native";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useMockAuth } from "@/components/providers";
import { getTeamBySlug } from "@/lib/mock/teams";
import { getGameById } from "@/lib/mock/games";
import { listPlayers } from "@/lib/mock/players";
import { listEvents, listMatchesForEvent } from "@/lib/mock/events";
import type { Match } from "@/lib/types";

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function TeamDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const teamSlug = slug as string;
  const { toggleFollow, isFollowing } = useMockAuth();

  const teamQ = useQuery({
    queryKey: ["team", teamSlug],
    queryFn: () => getTeamBySlug(teamSlug),
  });
  const team = teamQ.data;

  const gameQ = useQuery({
    queryKey: ["game", team?.gameId],
    queryFn: () => getGameById(team!.gameId),
    enabled: !!team,
  });

  const rosterQ = useQuery({
    queryKey: ["players", "team", team?.id],
    queryFn: () => listPlayers({ teamId: team!.id }),
    enabled: !!team,
  });

  const eventsQ = useQuery({
    queryKey: ["events", "team", team?.gameId],
    queryFn: () => listEvents({ gameId: team!.gameId }),
    enabled: !!team,
  });

  const teamEvents = (eventsQ.data ?? []).filter((e) =>
    e.teamIds.includes(team?.id ?? ""),
  );

  const matchesQ = useQuery({
    queryKey: [
      "matches",
      "team",
      team?.id,
      teamEvents.map((e) => e.id).join(","),
    ],
    queryFn: async () => {
      const arrays = await Promise.all(
        teamEvents.map((e) => listMatchesForEvent(e.id)),
      );
      return arrays
        .flat()
        .filter((m) => m.teamAId === team?.id || m.teamBId === team?.id);
    },
    enabled: !!team && teamEvents.length > 0,
  });

  if (!teamQ.isPending && !team) {
    return (
      <>
        <Stack.Screen options={{ title: "Team" }} />
        <View className="flex-1 items-center justify-center bg-background px-4">
          <Text className="text-2xl font-bold text-foreground">
            Team not found
          </Text>
          <Button
            className="mt-6 bg-brand"
            textClassName="text-black"
            onPress={() => router.push("/team")}
          >
            Back to teams
          </Button>
        </View>
      </>
    );
  }

  if (!team) {
    return (
      <>
        <Stack.Screen options={{ title: "Team" }} />
        <View className="flex-1 bg-background px-4 py-6">
          <Skeleton style={{ height: 224, borderRadius: 12 }} />
        </View>
      </>
    );
  }

  const following = isFollowing("team", team.id);
  const onFollow = () => {
    toggleFollow("team", team.id);
    toast.success(
      following ? `Unfollowed ${team.name}` : `Following ${team.name}`,
    );
  };

  const winRate =
    team.wins + team.losses === 0
      ? 0
      : Math.round((team.wins / (team.wins + team.losses)) * 100);
  const roster = rosterQ.data ?? [];
  const allMatches = (matchesQ.data ?? []) as Match[];
  const upcoming = allMatches.filter(
    (m) => m.state === "scheduled" || m.state === "live",
  );
  const past = allMatches.filter((m) => m.state === "completed");

  return (
    <>
      <Stack.Screen options={{ title: team.name }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="mb-6 overflow-hidden border-b border-border">
          <View
            style={{
              minHeight: 240,
              backgroundColor: "rgba(44,215,227,0.05)",
              position: "relative",
            }}
          >
            <Image
              source={team.logoUrl}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0.1,
              }}
              contentFit="contain"
            />
            <View
              className="absolute inset-x-0 bottom-0 h-2/3"
              style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
            />
            <View className="absolute inset-x-0 bottom-0 p-4">
            <Pressable
              onPress={() => router.push("/team")}
              className="flex-row items-center gap-1 self-start"
            >
              <ArrowLeft size={12} color="#a3a3a3" />
              <Text style={{ fontSize: 11, color: "#a3a3a3" }}>
                All teams
              </Text>
            </Pressable>
            <View className="mt-2 flex-row flex-wrap items-end gap-3">
              <Image
                source={team.logoUrl}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: "#0d0d0d",
                  backgroundColor: "#0d0d0d",
                }}
                contentFit="cover"
              />
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-2xl font-bold text-foreground">
                    {team.name}
                  </Text>
                  <View
                    className="rounded px-2 py-0.5"
                    style={{ backgroundColor: "#262626" }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: "#67e8f9",
                      }}
                    >
                      {team.tag}
                    </Text>
                  </View>
                </View>
                <View className="mt-1 flex-row flex-wrap items-center gap-3">
                  <View className="flex-row items-center gap-1">
                    <MapPin size={11} color="#a3a3a3" />
                    <Text style={{ fontSize: 11, color: "#a3a3a3" }}>
                      {team.country} · {team.region}
                    </Text>
                  </View>
                  {gameQ.data ? (
                    <Text style={{ fontSize: 11, color: "#67e8f9" }}>
                      {gameQ.data.name}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
            <Pressable
              onPress={onFollow}
              className="mt-4 self-start flex-row items-center gap-2 rounded-md px-4 py-2 active:opacity-80"
              style={{
                borderWidth: 1,
                borderColor: following
                  ? "rgba(44,215,227,0.5)"
                  : "transparent",
                backgroundColor: following
                  ? "rgba(44,215,227,0.1)"
                  : "#2CD7E3",
              }}
            >
              {following ? (
                <Bell size={14} color="#67e8f9" fill="#67e8f9" />
              ) : (
                <BellOff size={14} color="#000" />
              )}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: following ? "#67e8f9" : "#000",
                }}
              >
                {following ? "Following" : "Follow"}
              </Text>
            </Pressable>
            </View>
          </View>
        </View>

        <View className="px-4">
          <View className="mb-6 flex-row flex-wrap" style={{ gap: 12 }}>
            <View
              className="rounded-xl border border-border bg-card p-4"
              style={{ width: "48%" }}
            >
              <Text style={{ fontSize: 11, letterSpacing: 1, color: "#737373", textTransform: "uppercase" }}>
                Rank
              </Text>
              <View className="mt-1 flex-row items-center gap-1">
                <Trophy size={16} color="#fcd34d" />
                <Text
                  style={{ fontSize: 18, fontWeight: "700", color: "#fcd34d" }}
                >
                  #{team.ranking}
                </Text>
              </View>
            </View>
            <View
              className="rounded-xl border border-border bg-card p-4"
              style={{ width: "48%" }}
            >
              <Text style={{ fontSize: 11, letterSpacing: 1, color: "#737373", textTransform: "uppercase" }}>
                W-L
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#67e8f9",
                }}
              >
                {team.wins}-{team.losses}
              </Text>
              <Text style={{ fontSize: 11, color: "#737373" }}>
                {winRate}% win rate
              </Text>
            </View>
            <View
              className="rounded-xl border border-border bg-card p-4"
              style={{ width: "48%" }}
            >
              <Text style={{ fontSize: 11, letterSpacing: 1, color: "#737373", textTransform: "uppercase" }}>
                Followers
              </Text>
              <View className="mt-1 flex-row items-center gap-1">
                <Users size={16} color="#e5e5e5" />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#e5e5e5",
                  }}
                >
                  {formatFollowers(team.followers)}
                </Text>
              </View>
            </View>
            <View
              className="rounded-xl border border-border bg-card p-4"
              style={{ width: "48%" }}
            >
              <Text style={{ fontSize: 11, letterSpacing: 1, color: "#737373", textTransform: "uppercase" }}>
                Active roster
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#e5e5e5",
                }}
              >
                {roster.length}
              </Text>
            </View>
          </View>

          <View className="mb-8 gap-3">
            <Text className="text-xl font-semibold tracking-tight text-foreground">
              Roster
            </Text>
            {rosterQ.isPending ? (
              <Skeleton style={{ height: 80, borderRadius: 12 }} />
            ) : roster.length === 0 ? (
              <View className="rounded-xl border border-border bg-card p-6">
                <Text className="text-center text-sm text-muted-foreground">
                  Roster not yet announced.
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {roster.map((p) => (
                  <View
                    key={p.id}
                    className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3"
                  >
                    <Image
                      source={p.avatarUrl}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        borderWidth: 1,
                        borderColor: "#262626",
                      }}
                      contentFit="cover"
                    />
                    <View className="min-w-0 flex-1">
                      <Text
                        className="text-sm font-semibold text-foreground"
                        numberOfLines={1}
                      >
                        {p.handle}
                      </Text>
                      <Text
                        style={{ fontSize: 11, color: "#a3a3a3" }}
                        numberOfLines={1}
                      >
                        {p.realName}
                      </Text>
                      <Text
                        style={{
                          marginTop: 2,
                          fontSize: 11,
                          color: "#67e8f9",
                        }}
                      >
                        {p.role} · KDA {p.kda.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View className="mb-8 gap-3">
            <Text className="text-xl font-semibold tracking-tight text-foreground">
              Upcoming matches
            </Text>
            {upcoming.length === 0 ? (
              <View className="rounded-xl border border-border bg-card p-6">
                <Text className="text-center text-sm text-muted-foreground">
                  No scheduled matches.
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                {upcoming.map((m) => (
                  <View
                    key={m.id}
                    className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3"
                  >
                    <Calendar size={14} color="#67e8f9" />
                    <Text className="text-sm font-medium text-foreground">
                      {m.round}
                    </Text>
                    <Text style={{ fontSize: 11, color: "#737373" }}>
                      Bo{m.bestOf}
                    </Text>
                    <Text
                      style={{
                        marginLeft: "auto",
                        fontSize: 11,
                        color: "#a3a3a3",
                      }}
                    >
                      {new Date(m.scheduledAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View className="gap-3">
            <Text className="text-xl font-semibold tracking-tight text-foreground">
              Past matches
            </Text>
            {past.length === 0 ? (
              <View className="rounded-xl border border-border bg-card p-6">
                <Text className="text-center text-sm text-muted-foreground">
                  No past matches recorded.
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                {past.map((m) => {
                  const teamIsA = m.teamAId === team.id;
                  const ourScore = teamIsA ? m.scoreA : m.scoreB;
                  const theirScore = teamIsA ? m.scoreB : m.scoreA;
                  const won = ourScore > theirScore;
                  return (
                    <View
                      key={m.id}
                      className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3"
                    >
                      <View
                        className="rounded px-2 py-0.5"
                        style={{
                          backgroundColor: won
                            ? "rgba(44,215,227,0.1)"
                            : "rgba(244,63,94,0.1)",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "700",
                            letterSpacing: 1,
                            color: won ? "#67e8f9" : "#fda4af",
                          }}
                        >
                          {won ? "W" : "L"}
                        </Text>
                      </View>
                      <Text className="text-sm font-medium text-foreground">
                        {m.round}
                      </Text>
                      <Text
                        style={{
                          marginLeft: "auto",
                          fontSize: 13,
                          fontVariant: ["tabular-nums"],
                          color: "#e5e5e5",
                        }}
                      >
                        {ourScore} – {theirScore}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
