import * as React from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Search } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";

import { listGames } from "@/lib/api/games";
import { listTeams } from "@/lib/api/teams";
import { listPlayers } from "@/lib/api/players";
import { listEvents } from "@/lib/api/events";
import type {
  EsportsEvent,
  EventStatus,
  Game,
  Player,
  Team,
} from "@/lib/types";

import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { formatDate, formatNgn, formatNumber } from "./utils";

type ContentTab = "games" | "teams" | "players" | "events";

export function ContentManagerPage() {
  const [tab, setTab] = React.useState<ContentTab>("games");
  const [search, setSearch] = React.useState("");

  const gamesQuery = useQuery({
    queryKey: ["admin-content", "games"],
    queryFn: listGames,
    staleTime: 60_000,
  });
  const teamsQuery = useQuery({
    queryKey: ["admin-content", "teams"],
    queryFn: () => listTeams(),
    staleTime: 60_000,
  });
  const playersQuery = useQuery({
    queryKey: ["admin-content", "players"],
    queryFn: () => listPlayers(),
    staleTime: 60_000,
  });
  const eventsQuery = useQuery({
    queryKey: ["admin-content", "events"],
    queryFn: () => listEvents(),
    staleTime: 60_000,
  });

  const games = gamesQuery.data ?? [];
  const teams = teamsQuery.data ?? [];
  const players = playersQuery.data ?? [];
  const events = eventsQuery.data ?? [];

  const filteredGames = filterByQuery(games, search, (r) => [r.name, r.slug, r.shortName]);
  const filteredTeams = filterByQuery(teams, search, (r) => [r.name, r.slug, r.tag]);
  const filteredPlayers = filterByQuery(players, search, (r) => [r.handle, r.realName]);
  const filteredEvents = filterByQuery(events, search, (r) => [r.title, r.slug, r.format]);

  const gameMap = React.useMemo(() => {
    const m = new Map<string, Game>();
    for (const g of games) m.set(g.id, g);
    return m;
  }, [games]);

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <PageHeader
          title="Content"
          description="Games, teams, players and events catalog (read-only — CRUD via dedicated screens later)."
        />

        <Tabs value={tab} onValueChange={(v) => setTab(v as ContentTab)}>
          <TabsList className="mb-3">
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <View className="mb-3 flex-row items-center gap-2 rounded-md border border-border bg-card px-3">
            <Search size={14} color="#A3A3A3" />
            <Input
              value={search}
              onChangeText={setSearch}
              placeholder={`Search ${tab}…`}
              className="h-9 flex-1 border-0 bg-transparent px-0"
            />
          </View>

          <TabsContent value="games">
            <TabBody
              loading={gamesQuery.isLoading}
              error={gamesQuery.error}
              count={filteredGames.length}
              total={games.length}
              emptyLabel="No games match"
            >
              {filteredGames.map((row) => (
                <View
                  key={row.id}
                  className="mb-2 flex-row items-center gap-3 rounded-xl border border-border bg-card/40 p-3"
                >
                  <View className="h-10 w-10 overflow-hidden rounded bg-muted">
                    <Image
                      source={row.iconUrl}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">
                      {row.name}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      /{row.slug}
                    </Text>
                    <View className="mt-1 flex-row gap-1.5">
                      <StatusBadge tone="violet">
                        {row.category.toUpperCase()}
                      </StatusBadge>
                      <StatusBadge tone="neutral">{row.platform}</StatusBadge>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-[10px] text-muted-foreground">Players</Text>
                    <Text
                      className="text-sm text-foreground"
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      {formatNumber(row.activePlayers)}
                    </Text>
                  </View>
                </View>
              ))}
            </TabBody>
          </TabsContent>

          <TabsContent value="teams">
            <TabBody
              loading={teamsQuery.isLoading}
              error={teamsQuery.error}
              count={filteredTeams.length}
              total={teams.length}
              emptyLabel="No teams match"
            >
              {filteredTeams.map((row) => (
                <View
                  key={row.id}
                  className="mb-2 flex-row items-center gap-3 rounded-xl border border-border bg-card/40 p-3"
                >
                  <View className="h-10 w-10 overflow-hidden rounded bg-muted">
                    <Image
                      source={row.logoUrl}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">
                      {row.name}{" "}
                      <Text className="text-xs text-muted-foreground">
                        [{row.tag}]
                      </Text>
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {gameMap.get(row.gameId)?.shortName ?? "—"} · {row.region}{" "}
                      · #{row.ranking}
                    </Text>
                    <View className="mt-1 flex-row gap-1.5">
                      <StatusBadge tone="neutral">{row.country}</StatusBadge>
                    </View>
                  </View>
                  <Text
                    className="text-xs text-foreground"
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {formatNumber(row.followers)}
                  </Text>
                </View>
              ))}
            </TabBody>
          </TabsContent>

          <TabsContent value="players">
            <TabBody
              loading={playersQuery.isLoading}
              error={playersQuery.error}
              count={filteredPlayers.length}
              total={players.length}
              emptyLabel="No players match"
            >
              {filteredPlayers.map((row) => (
                <View
                  key={row.id}
                  className="mb-2 flex-row items-center gap-3 rounded-xl border border-border bg-card/40 p-3"
                >
                  <View className="h-10 w-10 overflow-hidden rounded-full bg-muted">
                    <Image
                      source={row.avatarUrl}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">
                      @{row.handle}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {row.realName} · {row.role ?? "—"}
                    </Text>
                  </View>
                </View>
              ))}
            </TabBody>
          </TabsContent>

          <TabsContent value="events">
            <TabBody
              loading={eventsQuery.isLoading}
              error={eventsQuery.error}
              count={filteredEvents.length}
              total={events.length}
              emptyLabel="No events match"
            >
              {filteredEvents.map((row) => {
                const statusTone: "emerald" | "amber" | "neutral" | "red" =
                  row.status === "live"
                    ? "emerald"
                    : row.status === "scheduled"
                      ? "amber"
                      : row.status === "completed"
                        ? "neutral"
                        : "red";
                return (
                  <View
                    key={row.id}
                    className="mb-2 rounded-xl border border-border bg-card/40 p-3"
                  >
                    <View className="flex-row items-start justify-between gap-2">
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-foreground">
                          {row.title}
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                          {gameMap.get(row.gameId)?.shortName ?? "—"} ·{" "}
                          {row.format}
                        </Text>
                      </View>
                      <StatusBadge
                        tone={statusTone}
                        dot={row.status === "live"}
                      >
                        {row.status}
                      </StatusBadge>
                    </View>
                    <Text className="mt-1.5 text-xs text-muted-foreground">
                      {formatDate(row.startsAt)} · {formatNgn(row.prizePoolNgn)}
                    </Text>
                  </View>
                );
              })}
            </TabBody>
          </TabsContent>
        </Tabs>
      </ScrollView>
    </View>
  );
}

function TabBody({
  loading,
  error,
  count,
  total,
  emptyLabel,
  children,
}: {
  loading: boolean;
  error: unknown;
  count: number;
  total: number;
  emptyLabel: string;
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <View className="items-center py-12">
        <ActivityIndicator color="#2CD7E3" />
      </View>
    );
  }
  if (error) {
    return (
      <Text className="py-6 text-center text-sm text-red-400">
        Failed to load. {error instanceof Error ? error.message : ""}
      </Text>
    );
  }
  if (count === 0) {
    return (
      <Text className="py-6 text-center text-sm text-muted-foreground">
        {emptyLabel}.
      </Text>
    );
  }
  return (
    <>
      <Text className="mb-2 text-xs text-muted-foreground">
        {count} of {total}
      </Text>
      {children}
    </>
  );
}

function filterByQuery<T>(
  rows: T[],
  q: string,
  get: (r: T) => string[],
): T[] {
  const s = q.trim().toLowerCase();
  if (!s) return rows;
  return rows.filter((r) => get(r).some((v) => v.toLowerCase().includes(s)));
}

// Type imports referenced in JSX above (kept for IDE/type checker)
export type _ContentTypeRefs = Game | Team | Player | EsportsEvent | EventStatus;
