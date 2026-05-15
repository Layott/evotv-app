import * as React from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { toast } from "sonner-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Globe,
  Lock,
  Plus,
  Sparkles,
  Tv2,
  Users,
} from "lucide-react-native";

import {
  joinWatchParty,
  leaveWatchParty,
  listWatchParties,
  type PartyListItem,
} from "@/lib/api/watch-parties";
import { useMockAuth } from "@/components/providers";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type VisibilityFilter = "all" | "public" | "private";

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <View className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
      <View className="flex-row items-center gap-1.5">
        {icon}
        <Text className="text-[10px] uppercase tracking-wider text-neutral-400">
          {label}
        </Text>
      </View>
      <Text className="mt-1 text-xl font-bold text-neutral-50">{value}</Text>
    </View>
  );
}

function PartyCard({
  party,
  isHost,
  busy,
  onJoin,
  onLeave,
  onOpen,
}: {
  party: PartyListItem;
  isHost: boolean;
  busy: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onOpen: () => void;
}) {
  return (
    <View className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/40">
      <Pressable onPress={onOpen} className="active:opacity-80">
        <View
          style={{ aspectRatio: 16 / 9, backgroundColor: "#171717" }}
          className="overflow-hidden"
        >
          {party.streamThumbnailUrl ? (
            <Image
              source={party.streamThumbnailUrl}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : null}
          <View className="absolute left-2 top-2 flex-row items-center gap-1 rounded bg-red-600/90 px-1.5 py-0.5">
            <View
              style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" }}
            />
            <Text className="text-[9px] font-bold uppercase text-white">Live</Text>
          </View>
          {party.isPrivate ? (
            <View className="absolute right-2 top-2 flex-row items-center gap-1 rounded bg-amber-500/90 px-1.5 py-0.5">
              <Lock size={9} color="#000" />
              <Text className="text-[9px] font-bold uppercase text-black">
                Invite
              </Text>
            </View>
          ) : null}
        </View>
        <View className="p-3">
          <Text className="text-sm font-semibold text-neutral-50" numberOfLines={1}>
            {party.name}
          </Text>
          <Text className="mt-0.5 text-[11px] text-neutral-400" numberOfLines={1}>
            {party.streamTitle
              ? `Watching: ${party.streamTitle}`
              : "No stream attached"}
          </Text>
          <Text className="mt-0.5 text-[10px] text-neutral-500" numberOfLines={1}>
            Host: {party.hostHandle ? `@${party.hostHandle}` : party.hostName ?? "—"}
          </Text>
          <View className="mt-2 flex-row flex-wrap items-center gap-2">
            <View className="flex-row items-center gap-1 rounded bg-neutral-800 px-1.5 py-0.5">
              <Users size={10} color="#A3A3A3" />
              <Text className="text-[10px] text-neutral-300">
                {party.activeMembers}/{party.maxMembers}
              </Text>
            </View>
            {isHost ? (
              <View className="rounded bg-brand/20 px-1.5 py-0.5">
                <Text className="text-[10px] text-brand">Hosting</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
      <View className="flex-row gap-2 px-3 pb-3">
        <Button
          size="sm"
          className="flex-1 bg-brand"
          onPress={onOpen}
          disabled={busy}
          textClassName="text-black"
        >
          Open room
        </Button>
        {isHost ? null : (
          <Button
            size="sm"
            variant="outline"
            className="border-neutral-700"
            onPress={onJoin}
            disabled={busy}
            textClassName="text-neutral-300"
          >
            Join
          </Button>
        )}
        {isHost ? null : (
          <Button
            size="sm"
            variant="outline"
            className="border-neutral-700"
            onPress={onLeave}
            disabled={busy}
            textClassName="text-neutral-300"
          >
            Leave
          </Button>
        )}
      </View>
    </View>
  );
}

export default function WatchPartiesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useMockAuth();

  const [visibilityFilter, setVisibilityFilter] =
    React.useState<VisibilityFilter>("all");
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const partiesQuery = useQuery({
    queryKey: ["watch-parties"],
    queryFn: listWatchParties,
    staleTime: 20_000,
  });

  const parties = partiesQuery.data ?? [];

  const joinMutation = useMutation({
    mutationFn: (partyId: string) => joinWatchParty(partyId),
    onSuccess: (_res, partyId) => {
      void queryClient.invalidateQueries({ queryKey: ["watch-parties"] });
      toast.success("Joined the party");
      router.push(`/watch-parties/${partyId}` as never);
    },
    onError: (err) => {
      toast.error("Couldn't join", {
        description: err instanceof Error ? err.message : String(err),
      });
    },
    onSettled: () => setBusyId(null),
  });

  const leaveMutation = useMutation({
    mutationFn: (partyId: string) => leaveWatchParty(partyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["watch-parties"] });
      toast.success("Left the party");
    },
    onError: (err) => {
      toast.error("Couldn't leave", {
        description: err instanceof Error ? err.message : String(err),
      });
    },
    onSettled: () => setBusyId(null),
  });

  function handleJoin(partyId: string) {
    if (!user) {
      toast.error("Sign in to join a party");
      return;
    }
    setBusyId(partyId);
    joinMutation.mutate(partyId);
  }

  function handleLeave(partyId: string) {
    if (!user) return;
    setBusyId(partyId);
    leaveMutation.mutate(partyId);
  }

  const filtered = React.useMemo(() => {
    if (visibilityFilter === "all") return parties;
    if (visibilityFilter === "public") return parties.filter((p) => !p.isPrivate);
    return parties.filter((p) => p.isPrivate);
  }, [parties, visibilityFilter]);

  const myHosted = React.useMemo(() => {
    if (!user) return [] as PartyListItem[];
    return filtered.filter((p) => p.hostUserId === user.id);
  }, [filtered, user]);

  const totalMembers = parties.reduce((sum, p) => sum + p.activeMembers, 0);
  const privateCount = parties.filter((p) => p.isPrivate).length;

  return (
    <>
      <Stack.Screen options={{ title: "Watch Parties" }} />
      <ScrollView
        className="flex-1 bg-background"
        refreshControl={
          <RefreshControl
            refreshing={partiesQuery.isFetching && !partiesQuery.isLoading}
            onRefresh={() => partiesQuery.refetch()}
            tintColor="#2CD7E3"
          />
        }
      >
        <View className="px-4 py-5">
          <Text className="text-2xl font-bold text-neutral-50">
            Watch Parties
          </Text>
          <Text className="mt-1 text-sm text-neutral-400">
            Co-watch live esports with friends. Side-by-side player + chat.
          </Text>

          <Button
            className="mt-4 bg-brand"
            onPress={() => router.push("/watch-parties/new" as never)}
            textClassName="text-black"
          >
            <Plus size={16} color="#000" />
            Host a party
          </Button>

          <View className="mt-5 flex-row gap-2">
            <StatTile
              icon={<Sparkles size={12} color="#7DD3FC" />}
              label="Active"
              value={parties.length}
            />
            <StatTile
              icon={<Users size={12} color="#FCD34D" />}
              label="Watching"
              value={totalMembers}
            />
            <StatTile
              icon={<Lock size={12} color="#A3A3A3" />}
              label="Invite-only"
              value={privateCount}
            />
          </View>

          <Text className="mt-5 text-[10px] uppercase tracking-wider text-neutral-500">
            Visibility
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-2"
          >
            {(["all", "public", "private"] as const).map((v) => (
              <Pressable
                key={v}
                onPress={() => setVisibilityFilter(v)}
                className={cn(
                  "mr-2 rounded-full border px-3 py-1.5",
                  visibilityFilter === v
                    ? "border-brand/50 bg-brand/10"
                    : "border-neutral-800 bg-neutral-900/60",
                )}
              >
                <Text
                  className={cn(
                    "text-xs font-medium capitalize",
                    visibilityFilter === v ? "text-brand" : "text-neutral-400",
                  )}
                >
                  {v}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Tabs defaultValue="browse" className="mt-5">
            <TabsList>
              <TabsTrigger value="browse">
                <Globe size={14} color="#A3A3A3" />
                <Text className="text-sm font-medium text-neutral-300">
                  Browse
                </Text>
              </TabsTrigger>
              <TabsTrigger value="mine">
                <Users size={14} color="#A3A3A3" />
                <Text className="text-sm font-medium text-neutral-300">
                  Hosting ({myHosted.length})
                </Text>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="browse">
              {partiesQuery.isLoading ? (
                <View className="gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-56 rounded-xl" />
                  ))}
                </View>
              ) : partiesQuery.isError ? (
                <View className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-10 items-center">
                  <Text className="text-sm text-red-400">
                    Failed to load parties.{" "}
                    {partiesQuery.error instanceof Error
                      ? partiesQuery.error.message
                      : ""}
                  </Text>
                </View>
              ) : filtered.length === 0 ? (
                <View className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-10">
                  <View className="items-center">
                    <Sparkles size={32} color="#525252" />
                  </View>
                  <Text className="mt-3 text-center text-sm font-semibold text-neutral-200">
                    No parties match your filter
                  </Text>
                  <Text className="mt-1 text-center text-xs text-neutral-500">
                    Adjust filters above or host one yourself.
                  </Text>
                  <Button
                    className="mt-4 bg-brand"
                    onPress={() => router.push("/watch-parties/new" as never)}
                    textClassName="text-black"
                  >
                    Host a party
                  </Button>
                </View>
              ) : (
                <View className="gap-3">
                  {filtered.map((p) => (
                    <PartyCard
                      key={p.id}
                      party={p}
                      isHost={user?.id === p.hostUserId}
                      busy={busyId === p.id}
                      onJoin={() => handleJoin(p.id)}
                      onLeave={() => handleLeave(p.id)}
                      onOpen={() =>
                        router.push(`/watch-parties/${p.id}` as never)
                      }
                    />
                  ))}
                </View>
              )}
            </TabsContent>

            <TabsContent value="mine">
              {partiesQuery.isLoading ? (
                <View className="gap-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-56 rounded-xl" />
                  ))}
                </View>
              ) : !user ? (
                <View className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-10 items-center">
                  <Sparkles size={32} color="#525252" />
                  <Text className="mt-3 text-center text-sm font-semibold text-neutral-200">
                    Sign in to see your hosted parties
                  </Text>
                </View>
              ) : myHosted.length === 0 ? (
                <View className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-10">
                  <View className="items-center">
                    <Tv2 size={32} color="#525252" />
                  </View>
                  <Text className="mt-3 text-center text-sm font-semibold text-neutral-200">
                    You're not hosting any parties
                  </Text>
                  <Text className="mt-1 text-center text-xs text-neutral-500">
                    Host one to see it here.
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {myHosted.map((p) => (
                    <PartyCard
                      key={p.id}
                      party={p}
                      isHost
                      busy={busyId === p.id}
                      onJoin={() => handleJoin(p.id)}
                      onLeave={() => handleLeave(p.id)}
                      onOpen={() =>
                        router.push(`/watch-parties/${p.id}` as never)
                      }
                    />
                  ))}
                </View>
              )}
            </TabsContent>
          </Tabs>
        </View>
      </ScrollView>
    </>
  );
}
