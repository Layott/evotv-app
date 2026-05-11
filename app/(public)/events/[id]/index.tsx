import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, BellOff, ListTree, Play } from "lucide-react-native";

import { EventHero } from "@/components/events/event-hero";
import { CountdownTimer } from "@/components/events/countdown-timer";
import { TeamRoster } from "@/components/events/team-roster";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  getEventById,
  listMatchesForEvent,
} from "@/lib/api/events";
import { getGameById } from "@/lib/api/games";
import { getTeamById } from "@/lib/api/teams";
import { listPlayers } from "@/lib/api/players";
import { listLiveStreams } from "@/lib/api/streams";
import { syncGet, syncSet } from "@/lib/storage/persist";
import type { Team } from "@/lib/types";

const REMINDERS_KEY = "evotv_reminders_v1";

function readReminders(): Set<string> {
  try {
    const raw = syncGet(REMINDERS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function writeReminders(s: Set<string>) {
  try {
    syncSet(REMINDERS_KEY, JSON.stringify([...s]));
  } catch {
    /* noop */
  }
}

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = id as string;

  const eventQ = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => getEventById(eventId),
  });
  const event = eventQ.data;

  const gameQ = useQuery({
    queryKey: ["game", event?.gameId],
    queryFn: () => getGameById(event!.gameId),
    enabled: !!event,
  });

  const teamsQ = useQuery({
    queryKey: ["event-teams", eventId, event?.teamIds.join(",")],
    queryFn: async () => {
      if (!event) return [] as Team[];
      const arr = await Promise.all(
        event.teamIds.map((tid) => getTeamById(tid)),
      );
      return arr.filter((t): t is Team => t !== null);
    },
    enabled: !!event,
  });

  const matchesQ = useQuery({
    queryKey: ["matches", eventId],
    queryFn: () => listMatchesForEvent(eventId),
  });

  const liveStreamQ = useQuery({
    queryKey: ["streams", "event", eventId],
    queryFn: async () => {
      const all = await listLiveStreams();
      return all.find((s) => s.eventId === eventId) ?? null;
    },
    enabled: event?.status === "live",
  });

  const allPlayersQ = useQuery({
    queryKey: ["players", "all"],
    queryFn: () => listPlayers(),
  });

  const [reminded, setReminded] = React.useState(false);
  React.useEffect(() => {
    if (!eventId) return;
    setReminded(readReminders().has(eventId));
  }, [eventId]);

  const toggleRemind = () => {
    const s = readReminders();
    if (s.has(eventId)) {
      s.delete(eventId);
      writeReminders(s);
      setReminded(false);
    } else {
      s.add(eventId);
      writeReminders(s);
      setReminded(true);
    }
  };

  if (!eventQ.isPending && !event) {
    return (
      <>
        <Stack.Screen options={{ title: "Event" }} />
        <View className="flex-1 items-center justify-center bg-background px-4">
          <Text className="text-2xl font-bold text-foreground">
            Event not found
          </Text>
          <Text className="mt-2 text-sm text-muted-foreground">
            The event you're looking for doesn't exist.
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

  if (!event) {
    return (
      <>
        <Stack.Screen options={{ title: "Event" }} />
        <View className="flex-1 bg-background px-4 py-6">
          <Skeleton style={{ height: 288, borderRadius: 12 }} />
        </View>
      </>
    );
  }

  const teams = teamsQ.data ?? [];
  const allPlayers = allPlayersQ.data ?? [];
  const matchesByState = matchesQ.data ?? [];

  return (
    <>
      <Stack.Screen options={{ title: event.title }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        <EventHero event={event} game={gameQ.data} />

        <View className="mb-6 gap-4">
          <Text className="text-sm leading-relaxed text-muted-foreground">
            {event.description}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {event.status === "live" && liveStreamQ.data ? (
              <Button
                className="bg-red-500"
                onPress={() =>
                  router.push(`/stream/${liveStreamQ.data!.id}`)
                }
              >
                <Play size={14} color="#ffffff" fill="#ffffff" />
                <Text className="text-sm font-semibold text-white">
                  Watch live
                </Text>
              </Button>
            ) : null}
            <Pressable
              onPress={toggleRemind}
              disabled={event.status === "completed"}
              className="flex-row items-center gap-2 rounded-md border px-4 py-2 active:opacity-80"
              style={{
                borderColor: reminded
                  ? "rgba(44,215,227,0.5)"
                  : "#262626",
                backgroundColor: reminded
                  ? "rgba(44,215,227,0.1)"
                  : "rgba(15,15,15,0.6)",
                opacity: event.status === "completed" ? 0.5 : 1,
              }}
            >
              {reminded ? (
                <Bell size={16} color="#67e8f9" fill="#67e8f9" />
              ) : (
                <BellOff size={16} color="#e5e5e5" />
              )}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: reminded ? "#67e8f9" : "#e5e5e5",
                }}
              >
                {reminded ? "Reminder on" : "Remind me"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push(`/events/${event.id}/bracket`)}
              className="flex-row items-center gap-2 rounded-md border border-border bg-card px-4 py-2 active:opacity-80"
            >
              <ListTree size={16} color="#e5e5e5" />
              <Text className="text-sm font-semibold text-foreground">
                View bracket
              </Text>
            </Pressable>
          </View>

          <View className="rounded-xl border border-border bg-card p-4">
            <View className="flex-row flex-wrap" style={{ gap: 12 }}>
              <View style={{ width: "48%" }}>
                <Text style={{ fontSize: 11, color: "#737373" }}>Format</Text>
                <Text className="mt-0.5 text-sm font-medium text-foreground">
                  {event.format}
                </Text>
              </View>
              <View style={{ width: "48%" }}>
                <Text style={{ fontSize: 11, color: "#737373" }}>Region</Text>
                <Text className="mt-0.5 text-sm font-medium text-foreground">
                  {event.region}
                </Text>
              </View>
              <View style={{ width: "48%" }}>
                <Text style={{ fontSize: 11, color: "#737373" }}>Teams</Text>
                <Text className="mt-0.5 text-sm font-medium text-foreground">
                  {event.teamIds.length}
                </Text>
              </View>
              <View style={{ width: "48%" }}>
                <Text style={{ fontSize: 11, color: "#737373" }}>Matches</Text>
                <Text className="mt-0.5 text-sm font-medium text-foreground">
                  {matchesByState.length}
                </Text>
              </View>
            </View>
          </View>

          <View className="rounded-xl border border-border bg-card p-4">
            {event.status === "scheduled" ? (
              <CountdownTimer target={event.startsAt} label="Starts in" />
            ) : null}
            {event.status === "live" ? (
              <View className="gap-2">
                <View
                  className="self-start flex-row items-center gap-2 rounded-md px-2.5 py-1"
                  style={{
                    borderWidth: 1,
                    borderColor: "rgba(239,68,68,0.3)",
                    backgroundColor: "rgba(239,68,68,0.1)",
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#ef4444",
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      letterSpacing: 1,
                      color: "#fca5a5",
                    }}
                  >
                    LIVE NOW
                  </Text>
                </View>
                <Text className="text-sm text-muted-foreground">
                  Event in progress.
                </Text>
              </View>
            ) : null}
            {event.status === "completed" ? (
              <View className="gap-2">
                <View
                  className="self-start rounded-md px-2.5 py-1"
                  style={{
                    borderWidth: 1,
                    borderColor: "#404040",
                    backgroundColor: "#262626",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      letterSpacing: 1,
                      color: "#a3a3a3",
                    }}
                  >
                    CONCLUDED
                  </Text>
                </View>
                <Text className="text-sm text-muted-foreground">
                  This event ended {new Date(event.endsAt).toLocaleDateString()}.
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View className="gap-3">
          <Text className="text-xl font-semibold tracking-tight text-foreground">
            Participating teams
          </Text>
          {teamsQ.isPending ? (
            <View className="gap-3">
              <Skeleton style={{ height: 160, borderRadius: 12 }} />
              <Skeleton style={{ height: 160, borderRadius: 12 }} />
            </View>
          ) : teams.length === 0 ? (
            <View className="rounded-xl border border-border bg-card p-6">
              <Text className="text-center text-sm text-muted-foreground">
                Teams TBA
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {teams.map((t) => (
                <TeamRoster
                  key={t.id}
                  team={t}
                  players={allPlayers.filter((p) => p.teamId === t.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}
