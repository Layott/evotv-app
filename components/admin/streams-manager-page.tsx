import * as React from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Copy, Key, Plus, RefreshCw, Search, Trash2, X } from "lucide-react-native";
import { toast } from "sonner-native";
import { useQuery } from "@tanstack/react-query";

import { listLiveStreams } from "@/lib/api/streams";
import { streams as streamsSource } from "@/lib/mock/streams";
import { listGames } from "@/lib/api/games";
import { games as gamesSource } from "@/lib/mock/games";
import { events as eventsSource } from "@/lib/mock/events";
import type { Stream } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { formatCompact, hashStreamKey, randomHex, timeAgo } from "./utils";

function resolveGameName(id: string) {
  return gamesSource.find((g) => g.id === id)?.shortName ?? id;
}

function resolveEventTitle(id: string | null) {
  if (!id) return null;
  return eventsSource.find((e) => e.id === id)?.title ?? null;
}

export function StreamsManagerPage() {
  const gamesQ = useQuery({ queryKey: ["admin", "games"], queryFn: listGames });
  const [all, setAll] = React.useState<Stream[]>(() => [...streamsSource]);

  const streamsQ = useQuery({
    queryKey: ["admin", "streams-all"],
    queryFn: async () => {
      await listLiveStreams();
      return all;
    },
  });

  React.useEffect(() => {
    if (streamsQ.data) setAll(streamsQ.data as Stream[]);
  }, [streamsQ.data]);

  const [search, setSearch] = React.useState("");
  const [gameFilter, setGameFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const filtered = React.useMemo(() => {
    let rows = all;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.streamerName.toLowerCase().includes(q),
      );
    }
    if (gameFilter !== "all")
      rows = rows.filter((s) => s.gameId === gameFilter);
    if (statusFilter === "live") rows = rows.filter((s) => s.isLive);
    if (statusFilter === "offline") rows = rows.filter((s) => !s.isLive);
    return rows;
  }, [all, search, gameFilter, statusFilter]);

  const [selected, setSelected] = React.useState<Stream | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [keyReveal, setKeyReveal] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<Stream | null>(null);

  function handleCreate(payload: NewStreamPayload) {
    const id = `stream_new_${Date.now()}`;
    const newStream: Stream = {
      id,
      title: payload.title,
      description: payload.description,
      gameId: payload.gameId,
      eventId: payload.eventId || null,
      streamerType: "official",
      streamerName: payload.streamerName,
      streamerAvatarUrl: "/placeholder.svg?height=80&width=80&text=NEW",
      isLive: false,
      startedAt: null,
      endedAt: null,
      hlsUrl: "/demo/sample.m3u8",
      thumbnailUrl: "/placeholder.svg?height=400&width=720&text=New+Stream",
      viewerCount: 0,
      peakViewerCount: 0,
      language: "en",
      tags: [],
      isPremium: payload.isPremium,
    };
    setAll((prev) => [newStream, ...prev]);
    setCreateOpen(false);
    toast.success("Stream created");
    const key = `sk_live_${randomHex(16)}`;
    setKeyReveal(key);
  }

  function handleRegenerate(row: Stream) {
    const key = `sk_live_${randomHex(16)}`;
    setKeyReveal(key);
    toast.success(`Regenerated stream key for ${row.title}`);
  }

  function handleDelete() {
    if (!confirmDelete) return;
    setAll((prev) => prev.filter((s) => s.id !== confirmDelete.id));
    toast.success(`Deleted "${confirmDelete.title}"`);
    setConfirmDelete(null);
    setSelected(null);
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <PageHeader
          title="Streams"
          description="Manage live broadcasts, stream keys and OBS settings."
          actions={
            <Button
              className="bg-cyan-500"
              onPress={() => setCreateOpen(true)}
            >
              <Plus size={14} color="#000" />
              <Text className="text-sm font-medium text-black">New</Text>
            </Button>
          }
        />

        <View className="mb-3 flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center gap-2 rounded-md border border-border bg-card px-3">
            <Search size={14} color="#A3A3A3" />
            <Input
              value={search}
              onChangeText={setSearch}
              placeholder="Search title or streamer"
              className="h-9 flex-1 border-0 bg-transparent px-0"
            />
          </View>
        </View>

        <View className="mb-3 flex-row items-center gap-2">
          <FilterPill
            label="All"
            active={statusFilter === "all"}
            onPress={() => setStatusFilter("all")}
          />
          <FilterPill
            label="Live"
            active={statusFilter === "live"}
            onPress={() => setStatusFilter("live")}
          />
          <FilterPill
            label="Offline"
            active={statusFilter === "offline"}
            onPress={() => setStatusFilter("offline")}
          />
          <Text className="ml-auto text-xs text-muted-foreground">
            {filtered.length}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3"
        >
          <View className="flex-row gap-2">
            <FilterPill
              label="All games"
              active={gameFilter === "all"}
              onPress={() => setGameFilter("all")}
            />
            {(gamesQ.data ?? []).map((g) => (
              <FilterPill
                key={g.id}
                label={g.shortName}
                active={gameFilter === g.id}
                onPress={() => setGameFilter(g.id)}
              />
            ))}
          </View>
        </ScrollView>

        {filtered.map((row) => (
          <Pressable
            key={row.id}
            onPress={() => setSelected(row)}
            className="mb-2 flex-row items-center gap-3 rounded-xl border border-border bg-card/40 p-3"
          >
            <View className="h-12 w-20 overflow-hidden rounded bg-muted">
              <Image
                source={row.thumbnailUrl}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            </View>
            <View className="min-w-0 flex-1">
              <Text
                numberOfLines={1}
                className="text-sm font-medium text-foreground"
              >
                {row.title}
              </Text>
              <Text
                numberOfLines={1}
                className="text-xs text-muted-foreground"
              >
                {row.streamerName} · {resolveGameName(row.gameId)}
              </Text>
              <View className="mt-1 flex-row items-center gap-2">
                {row.isLive ? (
                  <StatusBadge tone="red" dot>
                    LIVE
                  </StatusBadge>
                ) : (
                  <StatusBadge tone="neutral">Offline</StatusBadge>
                )}
                {row.isPremium ? (
                  <StatusBadge tone="amber">Premium</StatusBadge>
                ) : null}
                <Text className="text-xs text-muted-foreground">
                  {formatCompact(row.viewerCount)} viewers
                </Text>
              </View>
            </View>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                setConfirmDelete(row);
              }}
              hitSlop={8}
              className="rounded-md p-2"
              accessibilityLabel="Delete stream"
            >
              <Trash2 size={16} color="#A3A3A3" />
            </Pressable>
          </Pressable>
        ))}

        {filtered.length === 0 ? (
          <View className="rounded-xl border border-dashed border-border p-6">
            <Text className="text-center text-sm text-muted-foreground">
              No streams match these filters.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable
          onPress={() => setSelected(null)}
          className="flex-1 justify-end bg-black/50"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="max-h-[90%] rounded-t-2xl border border-border bg-background"
          >
            {selected ? (
              <ScrollView contentContainerStyle={{ padding: 16 }}>
                <View className="mb-4 flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-lg font-semibold text-foreground">
                      {selected.title}
                    </Text>
                    <Text className="mt-0.5 text-xs text-muted-foreground">
                      {resolveGameName(selected.gameId)} · {selected.streamerName}
                    </Text>
                  </View>
                  <Pressable onPress={() => setSelected(null)} hitSlop={8}>
                    <X size={20} color="#A3A3A3" />
                  </Pressable>
                </View>
                <View className="overflow-hidden rounded-lg border border-border">
                  <Image
                    source={selected.thumbnailUrl}
                    style={{ width: "100%", aspectRatio: 16 / 9 }}
                    contentFit="cover"
                  />
                </View>
                <View className="mt-4 flex-row flex-wrap gap-3">
                  <Info label="Status">
                    {selected.isLive ? (
                      <StatusBadge tone="red" dot>
                        LIVE
                      </StatusBadge>
                    ) : (
                      <StatusBadge tone="neutral">Offline</StatusBadge>
                    )}
                  </Info>
                  <Info label="Tier">
                    {selected.isPremium ? (
                      <StatusBadge tone="amber">Premium</StatusBadge>
                    ) : (
                      <StatusBadge tone="neutral">Free</StatusBadge>
                    )}
                  </Info>
                  <Info label="Viewers">
                    <Text className="text-sm text-foreground">
                      {selected.viewerCount.toLocaleString()}
                    </Text>
                  </Info>
                  <Info label="Peak">
                    <Text className="text-sm text-foreground">
                      {selected.peakViewerCount.toLocaleString()}
                    </Text>
                  </Info>
                  <Info label="Started">
                    <Text className="text-sm text-foreground">
                      {timeAgo(selected.startedAt)}
                    </Text>
                  </Info>
                  <Info label="Language">
                    <Text className="text-sm text-foreground">
                      {selected.language.toUpperCase()}
                    </Text>
                  </Info>
                </View>
                {resolveEventTitle(selected.eventId) ? (
                  <View className="mt-3">
                    <Text className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Event
                    </Text>
                    <Text className="text-sm text-foreground">
                      {resolveEventTitle(selected.eventId)}
                    </Text>
                  </View>
                ) : null}

                <View className="mt-3">
                  <Text className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Description
                  </Text>
                  <Text className="text-sm text-foreground">
                    {selected.description}
                  </Text>
                </View>

                <View className="mt-4 rounded-xl border border-border bg-card/40 p-4">
                  <View className="mb-3 flex-row items-center gap-2">
                    <Key size={14} color="#2CD7E3" />
                    <Text className="text-sm font-semibold text-foreground">
                      OBS / RTMP settings
                    </Text>
                  </View>
                  <SettingRow label="Server">
                    <Text className="font-mono text-xs text-foreground">
                      rtmp://localhost:1935/live
                    </Text>
                  </SettingRow>
                  <SettingRow label="Stream key">
                    <Text className="font-mono text-xs text-foreground">
                      {hashStreamKey(
                        `sk_live_${selected.id.slice(-16).padStart(16, "0")}`,
                      )}
                    </Text>
                  </SettingRow>
                  <SettingRow label="Video">
                    <Text className="text-xs text-foreground">
                      1080p · 6000 kbps · H.264
                    </Text>
                  </SettingRow>
                  <SettingRow label="Audio">
                    <Text className="text-xs text-foreground">
                      160 kbps · AAC · 48 kHz
                    </Text>
                  </SettingRow>
                  <SettingRow label="Keyframe">
                    <Text className="text-xs text-foreground">2 sec</Text>
                  </SettingRow>
                  <Button
                    variant="outline"
                    className="mt-3 self-start"
                    onPress={() => handleRegenerate(selected)}
                  >
                    <RefreshCw size={12} color="#FAFAFA" />
                    <Text className="text-xs text-foreground">
                      Regenerate key
                    </Text>
                  </Button>
                </View>

                <Button
                  variant="destructive"
                  className="mt-4"
                  onPress={() => setConfirmDelete(selected)}
                >
                  <Trash2 size={14} color="#fff" />
                  <Text className="text-sm text-white">Delete stream</Text>
                </Button>
              </ScrollView>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      <CreateStreamDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
      />

      <Dialog open={!!keyReveal} onOpenChange={(o) => !o && setKeyReveal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reveal stream key</DialogTitle>
            <DialogDescription>
              Copy this key now — it will not be shown again. Treat it like a
              password.
            </DialogDescription>
          </DialogHeader>
          <View className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <Text className="text-xs text-amber-300">
              Anyone with this key can stream on behalf of the account. Never
              share publicly.
            </Text>
          </View>
          <View className="flex-row items-center gap-2 rounded-md border border-border bg-card p-2">
            <Text
              numberOfLines={1}
              className="flex-1 font-mono text-sm text-cyan-300"
            >
              {keyReveal}
            </Text>
            <Pressable
              hitSlop={8}
              onPress={() => toast.success("Stream key copied")}
            >
              <Copy size={14} color="#A3A3A3" />
            </Pressable>
          </View>
          <DialogFooter>
            <Button onPress={() => setKeyReveal(null)} className="bg-cyan-500">
              <Text className="text-sm text-black">Done</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete stream?</DialogTitle>
            <DialogDescription>
              This will permanently remove "{confirmDelete?.title}". This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onPress={() => setConfirmDelete(null)}>
              <Text className="text-sm text-foreground">Cancel</Text>
            </Button>
            <Button variant="destructive" onPress={handleDelete}>
              <Text className="text-sm text-white">Delete</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  );
}

function FilterPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-3 py-1 ${
        active
          ? "border-cyan-500 bg-cyan-500/10"
          : "border-border bg-card"
      }`}
    >
      <Text
        className={`text-xs ${
          active ? "text-cyan-300" : "text-muted-foreground"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Info({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View>
      <Text className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </Text>
      <View className="mt-0.5">{children}</View>
    </View>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between gap-3 py-1">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <View className="flex-1 items-end">{children}</View>
    </View>
  );
}

interface NewStreamPayload {
  title: string;
  description: string;
  gameId: string;
  eventId: string;
  streamerName: string;
  isPremium: boolean;
}

function CreateStreamDrawer({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (payload: NewStreamPayload) => void;
}) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [gameId, setGameId] = React.useState(gamesSource[0]?.id ?? "");
  const [eventId, setEventId] = React.useState<string>("none");
  const [streamerName, setStreamerName] = React.useState("EVO TV Official");
  const [isPremium, setIsPremium] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setGameId(gamesSource[0]?.id ?? "");
      setEventId("none");
      setStreamerName("EVO TV Official");
      setIsPremium(false);
    }
  }, [open]);

  const disabled = !title.trim() || !gameId;

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={() => onOpenChange(false)}
    >
      <Pressable
        onPress={() => onOpenChange(false)}
        className="flex-1 justify-end bg-black/50"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="max-h-[92%] rounded-t-2xl border border-border bg-background"
        >
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View className="mb-4 flex-row items-start justify-between">
              <View>
                <Text className="text-lg font-semibold text-foreground">
                  New stream
                </Text>
                <Text className="mt-0.5 text-xs text-muted-foreground">
                  Configure an official broadcast. A stream key will be
                  generated.
                </Text>
              </View>
              <Pressable onPress={() => onOpenChange(false)} hitSlop={8}>
                <X size={20} color="#A3A3A3" />
              </Pressable>
            </View>

            <Field label="Title">
              <Input
                value={title}
                onChangeText={setTitle}
                placeholder="EVO Finals — Grand Final LIVE"
                className="bg-card"
              />
            </Field>
            <Field label="Description">
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder="What is this stream about?"
                multiline
                className="h-20 bg-card"
              />
            </Field>

            <Field label="Game">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {gamesSource.map((g) => (
                    <Pressable
                      key={g.id}
                      onPress={() => setGameId(g.id)}
                      className={`rounded-full border px-3 py-1.5 ${
                        gameId === g.id
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-border bg-card"
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          gameId === g.id
                            ? "text-cyan-300"
                            : "text-muted-foreground"
                        }`}
                      >
                        {g.shortName}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </Field>

            <Field label="Event (optional)">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => setEventId("none")}
                    className={`rounded-full border px-3 py-1.5 ${
                      eventId === "none"
                        ? "border-cyan-500 bg-cyan-500/10"
                        : "border-border bg-card"
                    }`}
                  >
                    <Text
                      className={`text-xs ${
                        eventId === "none"
                          ? "text-cyan-300"
                          : "text-muted-foreground"
                      }`}
                    >
                      No event
                    </Text>
                  </Pressable>
                  {eventsSource.map((e) => (
                    <Pressable
                      key={e.id}
                      onPress={() => setEventId(e.id)}
                      className={`rounded-full border px-3 py-1.5 ${
                        eventId === e.id
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-border bg-card"
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          eventId === e.id
                            ? "text-cyan-300"
                            : "text-muted-foreground"
                        }`}
                      >
                        {e.title}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </Field>

            <Field label="Streamer">
              <Input
                value={streamerName}
                onChangeText={setStreamerName}
                className="bg-card"
              />
            </Field>

            <View className="mt-3 flex-row items-center justify-between rounded-lg border border-border bg-card/40 p-3">
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">
                  Premium only
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Restrict access to premium subscribers.
                </Text>
              </View>
              <Switch checked={isPremium} onCheckedChange={setIsPremium} />
            </View>

            <View className="mt-5 flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onPress={() => onOpenChange(false)}
              >
                <Text className="text-sm text-foreground">Cancel</Text>
              </Button>
              <Button
                disabled={disabled}
                className="flex-1 bg-cyan-500"
                onPress={() =>
                  onSubmit({
                    title: title.trim(),
                    description: description.trim(),
                    gameId,
                    eventId: eventId === "none" ? "" : eventId,
                    streamerName: streamerName.trim() || "EVO TV Official",
                    isPremium,
                  })
                }
              >
                <Text className="text-sm font-medium text-black">
                  Create stream
                </Text>
              </Button>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-xs text-muted-foreground">{label}</Text>
      {children}
    </View>
  );
}
