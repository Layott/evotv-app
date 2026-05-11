import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react-native";

import { BracketView } from "@/components/events/bracket-view";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getEventById, listMatchesForEvent } from "@/lib/api/events";
import { listTeams } from "@/lib/api/teams";
import type { Team } from "@/lib/types";

export default function EventBracketScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = id as string;

  const eventQ = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => getEventById(eventId),
  });
  const matchesQ = useQuery({
    queryKey: ["matches", eventId],
    queryFn: () => listMatchesForEvent(eventId),
  });
  const teamsQ = useQuery({
    queryKey: ["teams"],
    queryFn: () => listTeams(),
  });

  const event = eventQ.data;
  const matches = matchesQ.data ?? [];
  const teamMap = new Map<string, Team>(
    (teamsQ.data ?? []).map((t) => [t.id, t]),
  );

  if (!eventQ.isPending && !event) {
    return (
      <>
        <Stack.Screen options={{ title: "Bracket" }} />
        <View className="flex-1 items-center justify-center bg-background px-4">
          <Text className="text-2xl font-bold text-foreground">
            Event not found
          </Text>
          <Button
            className="mt-6 bg-brand"
            textClassName="text-black"
            onPress={() => router.push("/events")}
          >
            Back to events
          </Button>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: event?.title ?? "Bracket" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingVertical: 16, paddingBottom: 32 }}
      >
        <View className="mb-6 px-4">
          <Pressable
            onPress={() =>
              event ? router.push(`/events/${event.id}`) : router.back()
            }
            className="flex-row items-center gap-1 self-start active:opacity-70"
          >
            <ArrowLeft size={12} color="#a3a3a3" />
            <Text style={{ fontSize: 11, color: "#a3a3a3" }}>
              Back to event
            </Text>
          </Pressable>
          <Text className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {event?.title ?? "Bracket"}
          </Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            {event?.format ?? "Single elimination"}
          </Text>
        </View>

        {matchesQ.isPending || teamsQ.isPending ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              gap: 24,
            }}
          >
            {[0, 1, 2].map((i) => (
              <Skeleton
                key={i}
                style={{
                  height: 160,
                  width: 256,
                  borderRadius: 12,
                }}
              />
            ))}
          </ScrollView>
        ) : (
          <BracketView matches={matches} teams={teamMap} />
        )}
      </ScrollView>
    </>
  );
}
