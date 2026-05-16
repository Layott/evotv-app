import * as React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";

import { ImageWithFallback } from "@/components/common/image-with-fallback";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, Eye, Search, UserRound, Users, X } from "lucide-react-native";

import { TopNavbar } from "@/components/home/top-navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { listGames } from "@/lib/api/games";
import { listLiveStreams } from "@/lib/api/streams";
import { listVods } from "@/lib/api/vods";
import { listTeams } from "@/lib/api/teams";
import { listPlayers } from "@/lib/api/players";
import { globalSearch, searchSuggestions } from "@/lib/api/search";

type ContentType = "all" | "streams" | "vods" | "teams" | "players";

function formatViewers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function LiveBadge() {
  return (
    <View
      className="flex-row items-center gap-1 rounded-md px-2 py-0.5"
      style={{
        borderWidth: 1,
        borderColor: "rgba(239,68,68,0.3)",
        backgroundColor: "rgba(239,68,68,0.1)",
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: "#ef4444",
        }}
      />
      <Text
        style={{
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 1,
          color: "#fca5a5",
        }}
      >
        LIVE
      </Text>
    </View>
  );
}

function useDebounced<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function Chip({
  active,
  onPress,
  label,
}: {
  active: boolean;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-full border px-3 py-1 active:opacity-70"
      style={{
        borderColor: active ? "rgba(44,215,227,0.5)" : "#262626",
        backgroundColor: active
          ? "rgba(44,215,227,0.1)"
          : "rgba(15,15,15,0.6)",
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "500",
          color: active ? "#67e8f9" : "#a3a3a3",
          textTransform: "capitalize",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function DiscoverScreen() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const debounced = useDebounced(query, 200);
  const [gameFilter, setGameFilter] = React.useState<string | null>(null);
  const [contentFilter, setContentFilter] = React.useState<ContentType>("all");
  const [pillarFilter, setPillarFilter] = React.useState<
    "all" | "esports" | "anime" | "lifestyle"
  >("all");

  const games = useQuery({ queryKey: ["games"], queryFn: () => listGames() });
  const suggestionsQ = useQuery({
    queryKey: ["search", "suggestions", debounced],
    queryFn: () => searchSuggestions(debounced, 8),
    enabled: debounced.length > 0,
  });
  const resultsQ = useQuery({
    queryKey: ["search", "results", debounced],
    queryFn: () => globalSearch(debounced),
    enabled: debounced.length > 0,
  });
  const liveQ = useQuery({
    queryKey: ["streams", "live", gameFilter],
    queryFn: () =>
      listLiveStreams(gameFilter ? { gameId: gameFilter } : undefined),
    enabled: debounced.length === 0,
  });
  const vodsQ = useQuery({
    queryKey: ["vods", "all", gameFilter],
    queryFn: () =>
      listVods(
        gameFilter ? { gameId: gameFilter, limit: 20 } : { limit: 20 },
      ),
    enabled: debounced.length === 0,
  });
  const teamsQ = useQuery({
    queryKey: ["teams", gameFilter],
    queryFn: () =>
      listTeams(gameFilter ? { gameId: gameFilter } : undefined),
    enabled: debounced.length === 0,
  });
  const playersQ = useQuery({
    queryKey: ["players", gameFilter],
    queryFn: () =>
      listPlayers(gameFilter ? { gameId: gameFilter } : undefined),
    enabled: debounced.length === 0,
  });

  const gameMap = new Map((games.data ?? []).map((g) => [g.id, g]));

  const rawStreams = debounced
    ? resultsQ.data?.streams ?? []
    : liveQ.data ?? [];
  const rawVods = debounced ? resultsQ.data?.vods ?? [] : vodsQ.data ?? [];
  const teams = debounced ? resultsQ.data?.teams ?? [] : teamsQ.data ?? [];
  const players = debounced
    ? resultsQ.data?.players ?? []
    : playersQ.data ?? [];

  // Apply pillar filter — rows without an explicit pillar default to esports.
  const streams =
    pillarFilter === "all"
      ? rawStreams
      : rawStreams.filter((s) => (s.pillar ?? "esports") === pillarFilter);
  const vods =
    pillarFilter === "all"
      ? rawVods
      : rawVods.filter((v) => (v.pillar ?? "esports") === pillarFilter);

  const totalResults =
    streams.length + vods.length + teams.length + players.length;

  return (
    <View className="flex-1 bg-background">
      <TopNavbar />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingVertical: 12, paddingBottom: 32 }}
      >
        <View className="px-4">
          <View
            className="flex-row items-center rounded-xl border border-border bg-card px-3"
            style={{ height: 44 }}
          >
            <Search size={16} color="#737373" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search streams, events, teams, players…"
              placeholderTextColor="#737373"
              className="ml-2 flex-1 text-sm text-foreground"
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {query.length > 0 ? (
              <Pressable
                onPress={() => setQuery("")}
                className="active:opacity-70"
              >
                <X size={16} color="#737373" />
              </Pressable>
            ) : null}
          </View>

          {debounced && (suggestionsQ.data ?? []).length > 0 ? (
            <View className="mt-2 overflow-hidden rounded-xl border border-border bg-background">
              {suggestionsQ.data!.map((s, i) => (
                <Pressable
                  key={`${s}-${i}`}
                  onPress={() => setQuery(s)}
                  className="flex-row items-center gap-2 border-b border-border px-3 py-2 active:opacity-70"
                >
                  <Search size={14} color="#737373" />
                  <Text className="text-sm text-foreground">{s}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            gap: 8,
            marginTop: 12,
          }}
        >
          <Chip
            active={gameFilter === null}
            onPress={() => setGameFilter(null)}
            label="All games"
          />
          {(games.data ?? []).map((g) => (
            <Chip
              key={g.id}
              active={gameFilter === g.id}
              onPress={() => setGameFilter(g.id)}
              label={g.shortName}
            />
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            gap: 8,
            marginTop: 8,
          }}
        >
          {(["all", "streams", "vods", "teams", "players"] as ContentType[]).map(
            (c) => (
              <Chip
                key={c}
                active={contentFilter === c}
                onPress={() => setContentFilter(c)}
                label={c}
              />
            ),
          )}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            gap: 8,
            marginTop: 8,
          }}
        >
          {(
            ["all", "esports", "anime", "lifestyle"] as const
          ).map((p) => (
            <Chip
              key={p}
              active={pillarFilter === p}
              onPress={() => setPillarFilter(p)}
              label={p}
            />
          ))}
        </ScrollView>

        {debounced && totalResults === 0 && !resultsQ.isPending ? (
          <View className="mx-4 mt-6 rounded-xl border border-border bg-card p-8">
            <Text className="text-center text-sm text-muted-foreground">
              No results for "{debounced}".
            </Text>
            <Text className="mt-2 text-center text-xs text-muted-foreground">
              Try searching for a game, team tag, player handle, or event.
            </Text>
          </View>
        ) : (
          <View className="mt-6 gap-8">
            {(contentFilter === "all" || contentFilter === "streams") &&
            streams.length > 0 ? (
              <View className="gap-3">
                <Text className="px-4 text-xl font-semibold tracking-tight text-foreground">
                  Streams
                </Text>
                <View className="gap-4 px-4">
                  {streams.map((s) => {
                    const game = gameMap.get(s.gameId);
                    return (
                      <Pressable
                        key={s.id}
                        onPress={() => router.push(`/stream/${s.id}`)}
                        className="overflow-hidden rounded-xl border border-border bg-card active:opacity-80"
                      >
                        <View
                          style={{
                            aspectRatio: 16 / 9,
                            position: "relative",
                          }}
                        >
                          <ImageWithFallback
                            source={s.thumbnailUrl}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                            fallbackLabel={s.title}
                            tintSeed={s.id}
                          />
                          {s.isLive ? (
                            <View className="absolute left-2 top-2">
                              <LiveBadge />
                            </View>
                          ) : null}
                          <View
                            className="absolute bottom-2 right-2 flex-row items-center gap-1 rounded-md px-1.5 py-0.5"
                            style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
                          >
                            <Eye size={11} color="#e5e5e5" />
                            <Text
                              style={{
                                fontSize: 11,
                                color: "#e5e5e5",
                              }}
                            >
                              {formatViewers(s.viewerCount)}
                            </Text>
                          </View>
                        </View>
                        <View className="gap-1 p-3">
                          <Text
                            className="text-sm font-semibold text-foreground"
                            numberOfLines={2}
                          >
                            {s.title}
                          </Text>
                          <Text
                            style={{ fontSize: 11, color: "#a3a3a3" }}
                          >
                            {s.streamerName}
                          </Text>
                          {game ? (
                            <Text
                              style={{ fontSize: 11, color: "#67e8f9" }}
                            >
                              {game.shortName}
                            </Text>
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {(contentFilter === "all" || contentFilter === "vods") &&
            vods.length > 0 ? (
              <View className="gap-3">
                <Text className="px-4 text-xl font-semibold tracking-tight text-foreground">
                  VODs
                </Text>
                <View className="gap-4 px-4">
                  {vods.map((v) => {
                    const game = gameMap.get(v.gameId);
                    return (
                      <Pressable
                        key={v.id}
                        onPress={() => router.push(`/vod/${v.id}`)}
                        className="overflow-hidden rounded-xl border border-border bg-card active:opacity-80"
                      >
                        <View
                          style={{
                            aspectRatio: 16 / 9,
                            position: "relative",
                          }}
                        >
                          <ImageWithFallback
                            source={v.thumbnailUrl}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                            fallbackLabel={v.title}
                            tintSeed={v.id}
                          />
                          <View
                            className="absolute bottom-2 right-2 flex-row items-center gap-1 rounded-md px-1.5 py-0.5"
                            style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
                          >
                            <Clock size={11} color="#e5e5e5" />
                            <Text
                              style={{ fontSize: 11, color: "#e5e5e5" }}
                            >
                              {formatDuration(v.durationSec)}
                            </Text>
                          </View>
                        </View>
                        <View className="gap-1 p-3">
                          <Text
                            className="text-sm font-semibold text-foreground"
                            numberOfLines={2}
                          >
                            {v.title}
                          </Text>
                          {game ? (
                            <Text
                              style={{ fontSize: 11, color: "#67e8f9" }}
                            >
                              {game.shortName}
                            </Text>
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {(contentFilter === "all" || contentFilter === "teams") &&
            teams.length > 0 ? (
              <View className="gap-3">
                <Text className="px-4 text-xl font-semibold tracking-tight text-foreground">
                  Teams
                </Text>
                <View className="gap-3 px-4">
                  {teams.map((t) => {
                    const game = gameMap.get(t.gameId);
                    return (
                      <Pressable
                        key={t.id}
                        onPress={() => router.push(`/team/${t.slug}`)}
                        className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3 active:opacity-80"
                      >
                        <Image
                          source={t.logoUrl}
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 6,
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
                            {t.name}
                          </Text>
                          <Text
                            style={{ fontSize: 11, color: "#a3a3a3" }}
                          >
                            {t.tag} · {game?.shortName}
                          </Text>
                          <View className="flex-row items-center gap-1">
                            <Users size={11} color="#737373" />
                            <Text
                              style={{ fontSize: 11, color: "#737373" }}
                            >
                              {formatViewers(t.followers)} followers
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {(contentFilter === "all" || contentFilter === "players") &&
            players.length > 0 ? (
              <View className="gap-3">
                <Text className="px-4 text-xl font-semibold tracking-tight text-foreground">
                  Players
                </Text>
                <View className="gap-3 px-4">
                  {players.slice(0, 20).map((p) => {
                    const game = gameMap.get(p.gameId);
                    return (
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
                            {p.role} · {game?.shortName}
                          </Text>
                          <View className="flex-row items-center gap-1">
                            <UserRound size={11} color="#737373" />
                            <Text
                              style={{ fontSize: 11, color: "#737373" }}
                            >
                              KDA {p.kda.toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {!debounced &&
            (liveQ.isPending ||
              vodsQ.isPending ||
              teamsQ.isPending ||
              playersQ.isPending) &&
            streams.length === 0 &&
            vods.length === 0 &&
            teams.length === 0 &&
            players.length === 0 ? (
              <View className="gap-3 px-4">
                <Skeleton style={{ height: 200, borderRadius: 12 }} />
                <Skeleton style={{ height: 200, borderRadius: 12 }} />
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
