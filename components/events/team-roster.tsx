import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

import type { Player, Team } from "@/lib/types";

export interface TeamRosterProps {
  team: Team;
  players: Player[];
}

export function TeamRoster({ team, players }: TeamRosterProps) {
  const router = useRouter();
  return (
    <View className="rounded-xl border border-border bg-card p-4">
      <View className="mb-3 flex-row items-center gap-3">
        <Image
          source={team.logoUrl}
          style={{
            width: 40,
            height: 40,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: "#262626",
          }}
          contentFit="cover"
        />
        <View className="min-w-0 flex-1">
          <Pressable
            onPress={() => router.push(`/team/${team.slug}`)}
            className="active:opacity-70"
          >
            <Text
              className="text-sm font-semibold text-foreground"
              numberOfLines={1}
            >
              {team.name}
            </Text>
          </Pressable>
          <Text style={{ fontSize: 11, color: "#a3a3a3" }}>
            {team.tag} · #{team.ranking}
          </Text>
        </View>
      </View>
      {players.length === 0 ? (
        <Text style={{ fontSize: 12, color: "#737373" }}>Roster TBA</Text>
      ) : (
        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          {players.slice(0, 6).map((p) => (
            <View
              key={p.id}
              className="flex-row items-center gap-2 rounded-md p-2"
              style={{
                backgroundColor: "#0d0d0d",
                width: "48%",
              }}
            >
              <Image
                source={p.avatarUrl}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#262626",
                }}
                contentFit="cover"
              />
              <View className="min-w-0 flex-1">
                <Text
                  className="text-xs font-semibold text-foreground"
                  numberOfLines={1}
                >
                  {p.handle}
                </Text>
                <Text
                  style={{ fontSize: 10, color: "#a3a3a3" }}
                  numberOfLines={1}
                >
                  {p.role}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default TeamRoster;
