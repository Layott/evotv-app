import * as React from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Stack } from "expo-router";
import { RotateCcw, Search, ShieldBan, X } from "lucide-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";

import {
  type AdminChannelRow,
  listAdminChannels,
  suspendChannel,
  unsuspendChannel,
} from "@/lib/api/channels-admin";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/admin/status-badge";

type Filter = "active" | "suspended";

export default function AdminChannelsScreen() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = React.useState<Filter>("active");
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<AdminChannelRow | null>(null);
  const [reason, setReason] = React.useState("");

  const channelsQ = useQuery({
    queryKey: ["admin-channels", filter],
    queryFn: () =>
      listAdminChannels({
        suspended: filter === "suspended" ? "only" : undefined,
        limit: 200,
      }),
    staleTime: 30_000,
  });

  const suspendMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      suspendChannel(id, reason),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-channels"] });
      setSelected(null);
      setReason("");
      toast.success(
        `Channel suspended · ${res.kickedStreams} live streams ended`,
      );
    },
    onError: (err) =>
      toast.error("Couldn't suspend", {
        description: err instanceof Error ? err.message : String(err),
      }),
  });

  const unsuspendMut = useMutation({
    mutationFn: (id: string) => unsuspendChannel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-channels"] });
      setSelected(null);
      toast.success("Channel restored");
    },
    onError: (err) =>
      toast.error("Couldn't restore", {
        description: err instanceof Error ? err.message : String(err),
      }),
  });

  const channels = channelsQ.data?.channels ?? [];
  const filtered = React.useMemo(() => {
    if (!search.trim()) return channels;
    const q = search.toLowerCase();
    return channels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.publisherName.toLowerCase().includes(q),
    );
  }, [channels, search]);

  function handleSuspend() {
    if (!selected) return;
    if (!reason.trim()) {
      Alert.alert("Reason required", "Please provide a reason for suspension.");
      return;
    }
    suspendMut.mutate({ id: selected.id, reason: reason.trim() });
  }

  return (
    <>
      <Stack.Screen options={{ title: "Channels" }} />
      <View className="flex-1 bg-background">
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          <View className="mb-2 flex-row items-center gap-2">
            <ShieldBan size={16} color="#F59E0B" />
            <Text className="text-2xl font-bold text-foreground">
              Channels
            </Text>
          </View>
          <Text className="mb-4 text-sm text-muted-foreground">
            Suspending a channel ends every live stream on it and hides it from
            public listings.
          </Text>

          <View className="mb-3 flex-row items-center gap-2 rounded-md border border-border bg-card px-3">
            <Search size={14} color="#A3A3A3" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search name, slug or publisher"
              placeholderTextColor="#737373"
              className="h-9 flex-1 text-sm text-foreground"
            />
          </View>

          <View className="mb-3 flex-row gap-2">
            {(["active", "suspended"] as Filter[]).map((f) => (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                className={`rounded-full border px-3 py-1.5 ${
                  filter === f
                    ? "border-brand bg-brand/15"
                    : "border-border bg-card"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    filter === f ? "text-brand" : "text-foreground"
                  }`}
                >
                  {f === "active" ? "Active" : "Suspended"}
                </Text>
              </Pressable>
            ))}
          </View>

          {channelsQ.isLoading ? (
            <View className="items-center py-8">
              <Spinner size="large" />
            </View>
          ) : filtered.length === 0 ? (
            <View className="items-center rounded-xl border border-dashed border-border p-8">
              <Text className="text-sm text-muted-foreground">
                No {filter} channels.
              </Text>
            </View>
          ) : (
            filtered.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => {
                  setSelected(c);
                  setReason("");
                }}
                className="mb-2 flex-row items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <View className="h-10 w-10 overflow-hidden rounded-lg bg-muted">
                  {c.logoUrl ? (
                    <Image
                      source={c.logoUrl}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  ) : null}
                </View>
                <View className="min-w-0 flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text
                      numberOfLines={1}
                      className="text-sm font-semibold text-foreground"
                    >
                      {c.name}
                    </Text>
                    {c.isVerified ? (
                      <StatusBadge tone="blue">verified</StatusBadge>
                    ) : null}
                  </View>
                  <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                    {c.publisherName} · {c.followerCount} followers
                  </Text>
                </View>
                {c.suspendedAt ? (
                  <StatusBadge tone="red">SUSPENDED</StatusBadge>
                ) : null}
              </Pressable>
            ))
          )}
        </ScrollView>

        <Modal
          visible={!!selected}
          transparent
          animationType="slide"
          onRequestClose={() => setSelected(null)}
        >
          <Pressable
            onPress={() => setSelected(null)}
            className="flex-1 justify-end bg-black/60"
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              className="max-h-[85%] rounded-t-2xl border border-border bg-background p-5"
            >
              {selected ? (
                <ScrollView>
                  <View className="mb-3 flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-lg font-semibold text-foreground">
                        {selected.name}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        @{selected.slug} · {selected.publisherName}
                      </Text>
                    </View>
                    <Pressable onPress={() => setSelected(null)} hitSlop={8}>
                      <X size={20} color="#A3A3A3" />
                    </Pressable>
                  </View>

                  {selected.suspendedAt ? (
                    <View className="rounded-md border border-destructive/40 bg-destructive/10 p-3 mb-3">
                      <Text className="text-[11px] uppercase tracking-wider text-destructive">
                        Suspended
                      </Text>
                      <Text className="mt-1 text-sm text-foreground">
                        {selected.suspendedReason ?? "No reason given"}
                      </Text>
                      <Text className="mt-1 text-[10px] text-muted-foreground">
                        On {new Date(selected.suspendedAt).toLocaleString()}
                      </Text>
                    </View>
                  ) : null}

                  {selected.suspendedAt ? (
                    <Pressable
                      onPress={() => unsuspendMut.mutate(selected.id)}
                      disabled={unsuspendMut.isPending}
                      className="flex-row items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-3"
                    >
                      <RotateCcw size={14} color="#10B981" />
                      <Text className="text-sm font-semibold text-emerald-400">
                        {unsuspendMut.isPending ? "Restoring…" : "Restore channel"}
                      </Text>
                    </Pressable>
                  ) : (
                    <>
                      <Text className="text-xs text-muted-foreground mb-1.5">
                        Suspension reason (required)
                      </Text>
                      <TextInput
                        value={reason}
                        onChangeText={setReason}
                        placeholder="Why is this channel being suspended?"
                        placeholderTextColor="#737373"
                        multiline
                        numberOfLines={3}
                        maxLength={500}
                        className="mb-3 rounded-md border border-border bg-card p-3 text-sm text-foreground"
                        style={{ minHeight: 75, textAlignVertical: "top" }}
                      />
                      <Pressable
                        onPress={handleSuspend}
                        disabled={suspendMut.isPending || !reason.trim()}
                        className="flex-row items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-destructive/15 px-3 py-3"
                        style={{
                          opacity:
                            suspendMut.isPending || !reason.trim() ? 0.5 : 1,
                        }}
                      >
                        <ShieldBan size={14} color="#EF4444" />
                        <Text className="text-sm font-semibold text-destructive">
                          {suspendMut.isPending ? "Suspending…" : "Suspend channel"}
                        </Text>
                      </Pressable>
                    </>
                  )}
                </ScrollView>
              ) : null}
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </>
  );
}
