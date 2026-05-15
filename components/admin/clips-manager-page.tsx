import * as React from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { RotateCcw, Search, Trash2, X } from "lucide-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";

import {
  adminDeleteClip,
  adminRestoreClip,
  listAdminClips,
  type AdminClip,
} from "@/lib/api/vods";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { formatCompact, timeAgo } from "./utils";

type Filter = "active" | "deleted";

export function ClipsManagerPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("active");
  const [selected, setSelected] = React.useState<AdminClip | null>(null);

  const clipsQ = useQuery({
    queryKey: ["admin-clips", filter],
    queryFn: () =>
      listAdminClips({
        deleted: filter === "deleted" ? "only" : undefined,
        limit: 200,
      }),
    staleTime: 30_000,
  });

  const deleteMut = useMutation({
    mutationFn: (clip: AdminClip) => adminDeleteClip(clip.id),
    onSuccess: () => {
      toast.success("Clip deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-clips"] });
      setSelected(null);
    },
    onError: (err) =>
      toast.error("Couldn't delete clip", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  const restoreMut = useMutation({
    mutationFn: (clip: AdminClip) => adminRestoreClip(clip.id),
    onSuccess: () => {
      toast.success("Clip restored");
      queryClient.invalidateQueries({ queryKey: ["admin-clips"] });
      setSelected(null);
    },
    onError: (err) =>
      toast.error("Couldn't restore clip", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  const clips = clipsQ.data?.clips ?? [];
  const filtered = React.useMemo(() => {
    if (!search.trim()) return clips;
    const q = search.toLowerCase();
    return clips.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.creatorHandle.toLowerCase().includes(q),
    );
  }, [clips, search]);

  function handleDelete(clip: AdminClip) {
    Alert.alert(
      "Delete clip?",
      `Soft-deletes "${clip.title}" by @${clip.creatorHandle}. Recoverable within 30 days.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteMut.mutate(clip) },
      ],
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <PageHeader
          title="Clips"
          description="User-generated short clips. Filter for deleted to restore."
        />

        <View className="mb-3 flex-row items-center gap-2 rounded-md border border-border bg-card px-3">
          <Search size={14} color="#A3A3A3" />
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Search title or creator"
            className="h-9 flex-1 border-0 bg-transparent px-0"
          />
        </View>

        <View className="mb-3 flex-row items-center gap-2">
          {(["active", "deleted"] as Filter[]).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 ${
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
                {f === "active" ? "Active" : "Deleted"}
              </Text>
            </Pressable>
          ))}
          <Text className="ml-auto text-xs text-muted-foreground">
            {filtered.length}
            {clipsQ.data?.total && filtered.length !== clipsQ.data.total
              ? ` of ${clipsQ.data.total}`
              : ""}
          </Text>
        </View>

        {clipsQ.isLoading ? (
          <View className="items-center py-8">
            <Spinner size="large" />
          </View>
        ) : filtered.length === 0 ? (
          <View className="items-center rounded-xl border border-dashed border-border p-8">
            <Text className="text-sm text-muted-foreground">
              No {filter === "deleted" ? "deleted clips" : "clips"}.
            </Text>
          </View>
        ) : (
          filtered.map((clip) => (
            <Pressable
              key={clip.id}
              onPress={() => setSelected(clip)}
              className="mb-2 flex-row items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <View className="h-16 w-12 overflow-hidden rounded bg-muted">
                <Image
                  source={clip.thumbnailUrl}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              </View>
              <View className="min-w-0 flex-1">
                <Text
                  numberOfLines={1}
                  className="text-sm font-medium text-foreground"
                >
                  {clip.title}
                </Text>
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                  @{clip.creatorHandle} · {formatCompact(clip.viewCount)} views ·{" "}
                  {timeAgo(clip.createdAt)}
                </Text>
              </View>
              {clip.deletedAt ? (
                <StatusBadge tone="red">Deleted</StatusBadge>
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
            className="max-h-[80%] rounded-t-2xl border border-border bg-background"
          >
            {selected ? (
              <ScrollView contentContainerStyle={{ padding: 16 }}>
                <View className="mb-3 flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-base font-semibold text-foreground">
                      {selected.title}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      @{selected.creatorHandle} · {timeAgo(selected.createdAt)}
                    </Text>
                  </View>
                  <Pressable onPress={() => setSelected(null)} hitSlop={8}>
                    <X size={20} color="#A3A3A3" />
                  </Pressable>
                </View>

                <View
                  className="mb-3 overflow-hidden rounded-lg border border-border bg-card"
                  style={{ aspectRatio: 9 / 16, maxHeight: 300, alignSelf: "center" }}
                >
                  <Image
                    source={selected.thumbnailUrl}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                </View>

                <View className="mt-3">
                  {selected.deletedAt ? (
                    <Pressable
                      onPress={() => restoreMut.mutate(selected)}
                      disabled={restoreMut.isPending}
                      className="flex-row items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-3"
                    >
                      <RotateCcw size={14} color="#10B981" />
                      <Text className="text-sm font-semibold text-emerald-400">
                        {restoreMut.isPending ? "Restoring…" : "Restore"}
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => handleDelete(selected)}
                      disabled={deleteMut.isPending}
                      className="flex-row items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-destructive/15 px-3 py-3"
                    >
                      <Trash2 size={14} color="#EF4444" />
                      <Text className="text-sm font-semibold text-destructive">
                        {deleteMut.isPending ? "Deleting…" : "Delete"}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </ScrollView>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
