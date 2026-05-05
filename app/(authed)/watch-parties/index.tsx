import * as React from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { toast } from "sonner-native";
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
  partyLanguageLabel,
  type WatchParty,
  type WatchPartyVisibility,
} from "@/lib/mock/watch-parties";
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
  joined,
  busy,
  onJoin,
  onLeave,
  onOpen,
}: {
  party: WatchParty;
  joined: boolean;
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
          <Image
            source={party.streamThumbnailUrl}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
          <View className="absolute left-2 top-2 flex-row items-center gap-1 rounded bg-red-600/90 px-1.5 py-0.5">
            <View
              style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" }}
            />
            <Text className="text-[9px] font-bold uppercase text-white">
              Live
            </Text>
          </View>
          {party.visibility === "invite" ? (
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
            Watching: {party.streamTitle}
          </Text>
          <View className="mt-2 flex-row flex-wrap items-center gap-2">
            <View className="flex-row items-center gap-1 rounded bg-neutral-800 px-1.5 py-0.5">
              <Users size={10} color="#A3A3A3" />
              <Text className="text-[10px] text-neutral-300">
                {party.members.length}/{party.maxGuests}
              </Text>
            </View>
            <View className="rounded bg-neutral-800 px-1.5 py-0.5">
              <Text className="text-[10px] text-neutral-300">
                {partyLanguageLabel(party.language)}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
      <View className="flex-row gap-2 px-3 pb-3">
        {joined ? (
          <>
            <Button
              size="sm"
              className="flex-1 bg-brand"
              onPress={onOpen}
              disabled={busy}
              textClassName="text-black"
            >
              Open room
            </Button>
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
          </>
        ) : (
          <Button
            size="sm"
            className="flex-1 bg-brand"
            onPress={onJoin}
            disabled={busy}
            textClassName="text-black"
          >
            Join party
          </Button>
        )}
      </View>
    </View>
  );
}

export default function WatchPartiesScreen() {
  const router = useRouter();
  const { user } = useMockAuth();

  const [parties, setParties] = React.useState<WatchParty[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [visibilityFilter, setVisibilityFilter] = React.useState<
    WatchPartyVisibility | "all"
  >("all");
  const [langFilter, setLangFilter] = React.useState<string>("all");

  const refresh = React.useCallback(async () => {
    const list = await listWatchParties();
    setParties(list);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    refresh().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  async function handleJoin(partyId: string) {
    if (!user) {
      toast.error("Sign in to join a party");
      return;
    }
    setBusyId(partyId);
    try {
      const res = await joinWatchParty(partyId, user);
      if (!res) {
        toast.error("Could not join party");
        return;
      }
      toast.success("Joined the party");
      router.push(`/watch-parties/${partyId}`);
    } finally {
      setBusyId(null);
    }
  }

  async function handleLeave(partyId: string) {
    if (!user) return;
    setBusyId(partyId);
    try {
      await leaveWatchParty(partyId, user.id);
      toast.success("Left the party");
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  const filtered = React.useMemo(() => {
    return parties.filter((p) => {
      if (visibilityFilter !== "all" && p.visibility !== visibilityFilter)
        return false;
      if (langFilter !== "all" && p.language !== langFilter) return false;
      return true;
    });
  }, [parties, visibilityFilter, langFilter]);

  const myParties = React.useMemo(() => {
    if (!user) return [] as WatchParty[];
    return filtered.filter((p) => p.members.some((m) => m.userId === user.id));
  }, [filtered, user]);

  const publicParties = React.useMemo(
    () => filtered.filter((p) => p.visibility === "public"),
    [filtered],
  );

  const totalMembers = parties.reduce((sum, p) => sum + p.members.length, 0);
  const languages = React.useMemo<string[]>(() => {
    const set = new Set(parties.map((p) => p.language as string));
    return Array.from(set);
  }, [parties]);

  return (
    <>
      <Stack.Screen options={{ title: "Watch Parties" }} />
      <ScrollView
        className="flex-1 bg-background"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
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
            onPress={() => router.push("/watch-parties/new")}
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
          </View>
          <View className="mt-2 flex-row gap-2">
            <StatTile
              icon={<Globe size={12} color="#34D399" />}
              label="Languages"
              value={languages.length}
            />
            <StatTile
              icon={<Lock size={12} color="#A3A3A3" />}
              label="Invite-only"
              value={parties.filter((p) => p.visibility === "invite").length}
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
            {(["all", "public", "invite"] as const).map((v) => (
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

          <Text className="mt-4 text-[10px] uppercase tracking-wider text-neutral-500">
            Language
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-2"
          >
            <Pressable
              onPress={() => setLangFilter("all")}
              className={cn(
                "mr-2 rounded-full border px-3 py-1.5",
                langFilter === "all"
                  ? "border-brand/50 bg-brand/10"
                  : "border-neutral-800 bg-neutral-900/60",
              )}
            >
              <Text
                className={cn(
                  "text-xs font-medium",
                  langFilter === "all" ? "text-brand" : "text-neutral-400",
                )}
              >
                All
              </Text>
            </Pressable>
            {languages.map((l) => (
              <Pressable
                key={l}
                onPress={() => setLangFilter(l)}
                className={cn(
                  "mr-2 rounded-full border px-3 py-1.5",
                  langFilter === l
                    ? "border-brand/50 bg-brand/10"
                    : "border-neutral-800 bg-neutral-900/60",
                )}
              >
                <Text
                  className={cn(
                    "text-xs font-medium",
                    langFilter === l ? "text-brand" : "text-neutral-400",
                  )}
                >
                  {partyLanguageLabel(l as never)}
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
                  Mine ({myParties.length})
                </Text>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="browse">
              {loading ? (
                <View className="gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-56 rounded-xl" />
                  ))}
                </View>
              ) : publicParties.length === 0 ? (
                <View className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-10">
                  <View className="items-center">
                    <Sparkles size={32} color="#525252" />
                  </View>
                  <Text className="mt-3 text-center text-sm font-semibold text-neutral-200">
                    No public parties match your filters
                  </Text>
                  <Text className="mt-1 text-center text-xs text-neutral-500">
                    Adjust filters above or host one yourself.
                  </Text>
                  <Button
                    className="mt-4 bg-brand"
                    onPress={() => router.push("/watch-parties/new")}
                    textClassName="text-black"
                  >
                    Host a party
                  </Button>
                </View>
              ) : (
                <View className="gap-3">
                  {publicParties.map((p) => (
                    <PartyCard
                      key={p.id}
                      party={p}
                      joined={!!user && p.members.some((m) => m.userId === user.id)}
                      busy={busyId === p.id}
                      onJoin={() => handleJoin(p.id)}
                      onLeave={() => handleLeave(p.id)}
                      onOpen={() => router.push(`/watch-parties/${p.id}`)}
                    />
                  ))}
                </View>
              )}
            </TabsContent>

            <TabsContent value="mine">
              {loading ? (
                <View className="gap-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-56 rounded-xl" />
                  ))}
                </View>
              ) : !user ? (
                <View className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-10">
                  <View className="items-center">
                    <Sparkles size={32} color="#525252" />
                  </View>
                  <Text className="mt-3 text-center text-sm font-semibold text-neutral-200">
                    Sign in to track parties
                  </Text>
                </View>
              ) : myParties.length === 0 ? (
                <View className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-10">
                  <View className="items-center">
                    <Tv2 size={32} color="#525252" />
                  </View>
                  <Text className="mt-3 text-center text-sm font-semibold text-neutral-200">
                    You're not in any parties
                  </Text>
                  <Text className="mt-1 text-center text-xs text-neutral-500">
                    Join a public party from the Browse tab, or host one.
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {myParties.map((p) => (
                    <PartyCard
                      key={p.id}
                      party={p}
                      joined
                      busy={busyId === p.id}
                      onJoin={() => handleJoin(p.id)}
                      onLeave={() => handleLeave(p.id)}
                      onOpen={() => router.push(`/watch-parties/${p.id}`)}
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
