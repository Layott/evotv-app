import * as React from "react";
import { useTokens } from "@/lib/theme/tokens";
import { ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";

import type { Match, Team } from "@/lib/types";

export interface BracketViewProps {
  matches: Match[];
  teams: Map<string, Team>;
}

function Row({
  team,
  score,
  win,
  played,
}: {
  team: Team | undefined;
  score: number;
  win: boolean;
  played: boolean;
}) {
  const palette = useTokens();
  return (
    <View
      className="flex-row items-center gap-2 px-3 py-2"
      style={{
        backgroundColor: win ? "rgba(70,227,206,0.05)" : "transparent",
      }}
    >
      {team ? (
        <>
          <Image
            source={team.logoUrl}
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
            }}
            contentFit="cover"
          />
          <Text
            style={{
              fontSize: 13,
              fontWeight: "500",
              color: win ? "#67e8f9" : palette.fg,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {team.name}
          </Text>
          <Text style={{ fontSize: 11, color: palette.muted }}>{team.tag}</Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: win ? "#67e8f9" : played ? palette.fg : palette.muted,
              marginLeft: 8,
              minWidth: 16,
              textAlign: "right",
              fontVariant: ["tabular-nums"],
            }}
          >
            {played ? score : "-"}
          </Text>
        </>
      ) : (
        <Text style={{ fontSize: 13, color: palette.muted }}>TBD</Text>
      )}
    </View>
  );
}

function MatchCard({
  match,
  teams,
}: {
  match: Match;
  teams: Map<string, Team>;
}) {
  const palette = useTokens();
  const a = teams.get(match.teamAId);
  const b = teams.get(match.teamBId);
  const completed = match.state === "completed";
  const aWin = completed && match.scoreA > match.scoreB;
  const bWin = completed && match.scoreB > match.scoreA;

  return (
    <View
      className="overflow-hidden rounded-xl border border-border bg-card"
      style={{ width: 256 }}
    >
      <View
        className="flex-row items-center justify-between border-b border-border px-3 py-1.5"
      >
        <Text
          style={{
            fontSize: 10,
            color: palette.muted,
          }}
        >
          Bo{match.bestOf}
        </Text>
        {match.state === "live" ? (
          <View className="flex-row items-center gap-1">
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: "#ef4444",
              }}
            />
            <Text style={{ fontSize: 10, color: "#fca5a5" }}>Live</Text>
          </View>
        ) : null}
        {match.state === "scheduled" ? (
          <Text style={{ fontSize: 10, color: palette.muted }}>
            {new Date(match.scheduledAt).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        ) : null}
        {completed ? (
          <Text style={{ fontSize: 10, color: palette.muted }}>Final</Text>
        ) : null}
      </View>
      <View>
        <Row
          team={a}
          score={match.scoreA}
          win={aWin}
          played={completed || match.state === "live"}
        />
        <View style={{ height: 1, backgroundColor: palette.subtle }} />
        <Row
          team={b}
          score={match.scoreB}
          win={bWin}
          played={completed || match.state === "live"}
        />
      </View>
    </View>
  );
}

export function BracketView({ matches, teams }: BracketViewProps) {
  if (matches.length === 0) {
    return (
      <View className="rounded-xl border border-border bg-card p-8">
        <Text className="text-center text-sm text-muted-foreground">
          Bracket TBD
        </Text>
      </View>
    );
  }

  // Group by round, preserving order of first appearance.
  const groups = new Map<string, Match[]>();
  for (const m of matches) {
    if (!groups.has(m.round)) groups.set(m.round, []);
    groups.get(m.round)!.push(m);
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
    >
      <View className="flex-row gap-6">
        {Array.from(groups.entries()).map(([round, ms]) => (
          <View key={round} className="gap-3" style={{ minWidth: 256 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: "#67e8f9",
              }}
            >
              {round}
            </Text>
            <View className="gap-3">
              {ms.map((m) => (
                <MatchCard key={m.id} match={m} teams={teams} />
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export default BracketView;
