import * as React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Plus, Search, Upload, X } from "@/components/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";

import {
  listAdminGames,
  createGame,
  updateGame,
  deleteGame,
  type CreateGamePayload,
} from "@/lib/api/games";
import { pickAndUploadImage, uploadErrorMessage } from "@/lib/api/uploads";
import { ImageWithFallback } from "@/components/common/image-with-fallback";
import { listTeams } from "@/lib/api/teams";
import { listPlayers } from "@/lib/api/players";
import { listEvents } from "@/lib/api/events";
import type {
  EsportsEvent,
  EventStatus,
  Game,
  Player,
  Team,
} from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { PageHeader } from "./page-header";
import { HowTo } from "./how-to";
import { StatusBadge } from "./status-badge";
import { formatDate, formatNgn, formatNumber } from "./utils";

type ContentTab = "games" | "teams" | "players" | "events";

const GAME_CATEGORIES: Game["category"][] = [
  "br",
  "fps",
  "moba",
  "sports",
  "fighting",
];
const GAME_PLATFORMS: Game["platform"][] = ["mobile", "pc", "console"];

export function ContentManagerPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = React.useState<ContentTab>("games");
  const [search, setSearch] = React.useState("");

  // Drawer state: null = closed, "new" = create, Game = edit.
  const [editing, setEditing] = React.useState<Game | "new" | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<Game | null>(null);

  const gamesQuery = useQuery({
    queryKey: ["admin-content", "games"],
    queryFn: listAdminGames,
    staleTime: 60_000,
  });
  const teamsQuery = useQuery({
    queryKey: ["admin-content", "teams"],
    queryFn: () => listTeams(),
    staleTime: 60_000,
  });
  const playersQuery = useQuery({
    queryKey: ["admin-content", "players"],
    queryFn: () => listPlayers(),
    staleTime: 60_000,
  });
  const eventsQuery = useQuery({
    queryKey: ["admin-content", "events"],
    queryFn: () => listEvents(),
    staleTime: 60_000,
  });

  const games = gamesQuery.data ?? [];
  const teams = teamsQuery.data ?? [];
  const players = playersQuery.data ?? [];
  const events = eventsQuery.data ?? [];

  const filteredGames = filterByQuery(games, search, (r) => [r.name, r.slug, r.shortName]);
  const filteredTeams = filterByQuery(teams, search, (r) => [r.name, r.slug, r.tag]);
  const filteredPlayers = filterByQuery(players, search, (r) => [r.handle, r.realName]);
  const filteredEvents = filterByQuery(events, search, (r) => [r.title, r.slug, r.format]);

  const gameMap = React.useMemo(() => {
    const m = new Map<string, Game>();
    for (const g of games) m.set(g.id, g);
    return m;
  }, [games]);

  // Invalidate both the admin list AND the public Discover/Categories list.
  function invalidateGames() {
    void queryClient.invalidateQueries({ queryKey: ["admin-content", "games"] });
    void queryClient.invalidateQueries({ queryKey: ["games"] });
  }

  const createMutation = useMutation({
    mutationFn: (payload: CreateGamePayload) => createGame(payload),
    onSuccess: () => {
      invalidateGames();
      toast.success("Game created");
      setEditing(null);
    },
    onError: (err) => {
      toast.error("Failed to create game", {
        description: err instanceof Error ? err.message : String(err),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; payload: CreateGamePayload }) =>
      updateGame(vars.id, vars.payload),
    onSuccess: () => {
      invalidateGames();
      toast.success("Game updated");
      setEditing(null);
    },
    onError: (err) => {
      toast.error("Failed to update game", {
        description: err instanceof Error ? err.message : String(err),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGame(id),
    onSuccess: () => {
      invalidateGames();
      toast.success("Game deleted");
      setPendingDelete(null);
      setEditing(null);
    },
    onError: (err) => {
      toast.error("Failed to delete game", {
        description: err instanceof Error ? err.message : String(err),
      });
    },
  });

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <PageHeader
          title="Content"
          description="Games are the catalog categories powering Discover. Teams, players and events are read-only here."
          actions={
            tab === "games" ? (
              <Button className="bg-cyan-500" onPress={() => setEditing("new")}>
                <Plus size={14} color="#000" />
                <Text className="text-sm font-medium text-black">New game</Text>
              </Button>
            ) : null
          }
        />
        <HowTo page="content" />

        <Tabs value={tab} onValueChange={(v) => setTab(v as ContentTab)}>
          <TabsList className="mb-3">
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <View className="mb-3 flex-row items-center gap-2 rounded-md border border-border bg-card px-3">
            <Search size={14} color="#9FBDBD" />
            <Input
              value={search}
              onChangeText={setSearch}
              placeholder={`Search ${tab}…`}
              className="h-9 flex-1 border-0 bg-transparent px-0"
            />
          </View>

          <TabsContent value="games">
            <TabBody
              loading={gamesQuery.isLoading}
              error={gamesQuery.error}
              count={filteredGames.length}
              total={games.length}
              emptyLabel="No games match"
            >
              {filteredGames.map((row) => (
                <Pressable
                  key={row.id}
                  onPress={() => setEditing(row)}
                  className="mb-2 flex-row items-center gap-3 rounded-xl border border-border bg-card/40 p-3"
                >
                  <View className="h-10 w-10 overflow-hidden rounded bg-muted">
                    <Image
                      source={row.iconUrl}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">
                      {row.name}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      /{row.slug}
                    </Text>
                    <View className="mt-1 flex-row flex-wrap gap-1.5">
                      <StatusBadge tone="neutral">
                        {row.category.toUpperCase()}
                      </StatusBadge>
                      <StatusBadge tone="neutral">{row.platform}</StatusBadge>
                      {row.featured ? (
                        <StatusBadge tone="amber">Featured</StatusBadge>
                      ) : null}
                      {row.enabled ? (
                        <StatusBadge tone="emerald">Live</StatusBadge>
                      ) : (
                        <StatusBadge tone="red">Hidden</StatusBadge>
                      )}
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-[10px] text-muted-foreground">
                      Order {row.displayOrder}
                    </Text>
                    <Text
                      className="text-sm text-foreground"
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      {formatNumber(row.activePlayers)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </TabBody>
          </TabsContent>

          <TabsContent value="teams">
            <TabBody
              loading={teamsQuery.isLoading}
              error={teamsQuery.error}
              count={filteredTeams.length}
              total={teams.length}
              emptyLabel="No teams match"
            >
              {filteredTeams.map((row) => (
                <View
                  key={row.id}
                  className="mb-2 flex-row items-center gap-3 rounded-xl border border-border bg-card/40 p-3"
                >
                  <View className="h-10 w-10 overflow-hidden rounded bg-muted">
                    <Image
                      source={row.logoUrl}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">
                      {row.name}{" "}
                      <Text className="text-xs text-muted-foreground">
                        [{row.tag}]
                      </Text>
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {gameMap.get(row.gameId)?.shortName ?? "-"} · {row.region}{" "}
                      · #{row.ranking}
                    </Text>
                    <View className="mt-1 flex-row gap-1.5">
                      <StatusBadge tone="neutral">{row.country}</StatusBadge>
                    </View>
                  </View>
                  <Text
                    className="text-xs text-foreground"
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {formatNumber(row.followers)}
                  </Text>
                </View>
              ))}
            </TabBody>
          </TabsContent>

          <TabsContent value="players">
            <TabBody
              loading={playersQuery.isLoading}
              error={playersQuery.error}
              count={filteredPlayers.length}
              total={players.length}
              emptyLabel="No players match"
            >
              {filteredPlayers.map((row) => (
                <View
                  key={row.id}
                  className="mb-2 flex-row items-center gap-3 rounded-xl border border-border bg-card/40 p-3"
                >
                  <View className="h-10 w-10 overflow-hidden rounded-full bg-muted">
                    <Image
                      source={row.avatarUrl}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">
                      @{row.handle}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {row.realName} · {row.role ?? "-"}
                    </Text>
                  </View>
                </View>
              ))}
            </TabBody>
          </TabsContent>

          <TabsContent value="events">
            <TabBody
              loading={eventsQuery.isLoading}
              error={eventsQuery.error}
              count={filteredEvents.length}
              total={events.length}
              emptyLabel="No events match"
            >
              {filteredEvents.map((row) => {
                const statusTone: "emerald" | "amber" | "neutral" | "red" =
                  row.status === "live"
                    ? "emerald"
                    : row.status === "scheduled"
                      ? "amber"
                      : row.status === "completed"
                        ? "neutral"
                        : "red";
                return (
                  <View
                    key={row.id}
                    className="mb-2 rounded-xl border border-border bg-card/40 p-3"
                  >
                    <View className="flex-row items-start justify-between gap-2">
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-foreground">
                          {row.title}
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                          {gameMap.get(row.gameId)?.shortName ?? "-"} ·{" "}
                          {row.format}
                        </Text>
                      </View>
                      <StatusBadge
                        tone={statusTone}
                        dot={row.status === "live"}
                      >
                        {row.status}
                      </StatusBadge>
                    </View>
                    <Text className="mt-1.5 text-xs text-muted-foreground">
                      {formatDate(row.startsAt)} · {formatNgn(row.prizePoolNgn)}
                    </Text>
                  </View>
                );
              })}
            </TabBody>
          </TabsContent>
        </Tabs>
      </ScrollView>

      <GameDrawer
        mode={editing}
        submitting={createMutation.isPending || updateMutation.isPending}
        onClose={() => setEditing(null)}
        onDelete={(game) => setPendingDelete(game)}
        onSubmit={(payload) => {
          if (editing && editing !== "new") {
            updateMutation.mutate({ id: editing.id, payload });
          } else {
            createMutation.mutate(payload);
          }
        }}
      />

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => {
          if (!o) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete game?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `"${pendingDelete.name}" will be removed from the catalog and Discover. This cannot be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive"
              textClassName="text-white"
              disabled={deleteMutation.isPending}
              onPress={() => {
                if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}

function GameDrawer({
  mode,
  submitting,
  onClose,
  onDelete,
  onSubmit,
}: {
  mode: Game | "new" | null;
  submitting: boolean;
  onClose: () => void;
  onDelete: (game: Game) => void;
  onSubmit: (payload: CreateGamePayload) => void;
}) {
  const open = mode !== null;
  const editingGame = mode && mode !== "new" ? mode : null;

  const [slug, setSlug] = React.useState("");
  const [name, setName] = React.useState("");
  const [shortName, setShortName] = React.useState("");
  const [coverUrl, setCoverUrl] = React.useState("");
  const [iconUrl, setIconUrl] = React.useState("");
  const [category, setCategory] = React.useState<Game["category"]>("br");
  const [platform, setPlatform] = React.useState<Game["platform"]>("mobile");
  const [activePlayers, setActivePlayers] = React.useState("0");
  const [enabled, setEnabled] = React.useState(true);
  const [featured, setFeatured] = React.useState(false);
  const [displayOrder, setDisplayOrder] = React.useState("0");

  // Reset / hydrate fields whenever the drawer opens or the target changes.
  React.useEffect(() => {
    if (!open) return;
    setSlug(editingGame?.slug ?? "");
    setName(editingGame?.name ?? "");
    setShortName(editingGame?.shortName ?? "");
    setCoverUrl(editingGame?.coverUrl ?? "");
    setIconUrl(editingGame?.iconUrl ?? "");
    setCategory(editingGame?.category ?? "br");
    setPlatform(editingGame?.platform ?? "mobile");
    setActivePlayers(String(editingGame?.activePlayers ?? 0));
    setEnabled(editingGame?.enabled ?? true);
    setFeatured(editingGame?.featured ?? false);
    setDisplayOrder(String(editingGame?.displayOrder ?? 0));
  }, [open, editingGame]);

  const playersNum = Number.parseInt(activePlayers, 10);
  const orderNum = Number.parseInt(displayOrder, 10);

  const valid =
    slug.trim().length > 0 &&
    name.trim().length > 0 &&
    shortName.trim().length > 0 &&
    coverUrl.trim().length > 0 &&
    iconUrl.trim().length > 0 &&
    Number.isFinite(playersNum) &&
    playersNum >= 0 &&
    Number.isFinite(orderNum) &&
    orderNum >= 0;

  const disabled = submitting || !valid;

  function handleSubmit() {
    onSubmit({
      slug: slug.trim(),
      name: name.trim(),
      shortName: shortName.trim(),
      coverUrl: coverUrl.trim(),
      iconUrl: iconUrl.trim(),
      category,
      platform,
      activePlayers: Number.isFinite(playersNum) ? playersNum : 0,
      enabled,
      featured,
      displayOrder: Number.isFinite(orderNum) ? orderNum : 0,
    });
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/50">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="max-h-[92%] rounded-t-2xl border border-border bg-background"
        >
          <ScrollView
            contentContainerStyle={{ padding: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="mb-4 flex-row items-start justify-between">
              <Text className="text-lg font-semibold text-foreground">
                {editingGame ? "Edit game" : "New game"}
              </Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <X size={20} color="#9FBDBD" />
              </Pressable>
            </View>

            <Field label="Slug">
              <Input
                value={slug}
                onChangeText={setSlug}
                autoCapitalize="none"
                placeholder="free-fire"
                className="bg-card"
              />
            </Field>

            <Field label="Name">
              <Input
                value={name}
                onChangeText={setName}
                placeholder="Garena Free Fire"
                className="bg-card"
              />
            </Field>

            <Field label="Short name">
              <Input
                value={shortName}
                onChangeText={setShortName}
                placeholder="Free Fire"
                className="bg-card"
              />
            </Field>

            <ImageUploadField
              label="Cover image"
              buttonLabel="Upload cover"
              value={coverUrl}
              onChange={setCoverUrl}
              previewHeight={72}
              previewWidth={128}
            />

            <ImageUploadField
              label="Icon image"
              buttonLabel="Upload icon"
              value={iconUrl}
              onChange={setIconUrl}
              previewHeight={56}
              previewWidth={56}
            />

            <View className="mb-3 flex-row gap-3">
              <View className="flex-1">
                <Label className="mb-1.5 text-xs text-muted-foreground">
                  Category
                </Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as Game["category"])}
                >
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {GAME_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </View>
              <View className="flex-1">
                <Label className="mb-1.5 text-xs text-muted-foreground">
                  Platform
                </Label>
                <Select
                  value={platform}
                  onValueChange={(v) => setPlatform(v as Game["platform"])}
                >
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {GAME_PLATFORMS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </View>
            </View>

            <View className="mb-3 flex-row gap-3">
              <View className="flex-1">
                <Label className="mb-1.5 text-xs text-muted-foreground">
                  Active players
                </Label>
                <Input
                  value={activePlayers}
                  onChangeText={setActivePlayers}
                  keyboardType="number-pad"
                  placeholder="0"
                  className="bg-card"
                />
              </View>
              <View className="flex-1">
                <Label className="mb-1.5 text-xs text-muted-foreground">
                  Display order
                </Label>
                <Input
                  value={displayOrder}
                  onChangeText={setDisplayOrder}
                  keyboardType="number-pad"
                  placeholder="0"
                  className="bg-card"
                />
              </View>
            </View>

            <View className="mb-1 flex-row items-center justify-between rounded-md border border-border bg-card/40 px-3 py-2.5">
              <View className="flex-1 pr-3">
                <Text className="text-sm font-medium text-foreground">
                  Enabled
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Show this game on Discover and Categories.
                </Text>
              </View>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </View>

            <View className="mb-1 flex-row items-center justify-between rounded-md border border-border bg-card/40 px-3 py-2.5">
              <View className="flex-1 pr-3">
                <Text className="text-sm font-medium text-foreground">
                  Featured
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Pin to the top of the catalog ordering.
                </Text>
              </View>
              <Switch checked={featured} onCheckedChange={setFeatured} />
            </View>

            {editingGame ? (
              <Button
                variant="ghost"
                className="mt-3 self-start"
                disabled={submitting}
                onPress={() => onDelete(editingGame)}
              >
                <Text className="text-sm font-medium text-destructive">
                  Delete game
                </Text>
              </Button>
            ) : null}

            <View className="mt-5 flex-row gap-2">
              <Button variant="outline" className="flex-1" onPress={onClose}>
                <Text className="text-sm text-foreground">Cancel</Text>
              </Button>
              <Button
                disabled={disabled}
                className="flex-1 bg-cyan-500"
                onPress={handleSubmit}
              >
                <Text className="text-sm font-medium text-black">
                  {submitting
                    ? "Saving…"
                    : editingGame
                      ? "Save changes"
                      : "Create game"}
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
      <Label className="mb-1.5 text-xs text-muted-foreground">{label}</Label>
      {children}
    </View>
  );
}

/**
 * Drawer image field: picks from the device library, uploads via the
 * admin-only /api/admin/uploads endpoint, and stores the resulting blob URL
 * in the parent's string state. Shows a preview + Remove affordance when a
 * URL is set. Validation and payload shape stay plain strings.
 */
function ImageUploadField({
  label,
  buttonLabel,
  value,
  onChange,
  previewHeight,
  previewWidth,
}: {
  label: string;
  buttonLabel: string;
  value: string;
  onChange: (url: string) => void;
  previewHeight: number;
  previewWidth: number;
}) {
  const [uploading, setUploading] = React.useState(false);

  async function handlePick() {
    try {
      setUploading(true);
      const url = await pickAndUploadImage();
      if (url) onChange(url);
    } catch (err) {
      toast.error("Upload failed", { description: uploadErrorMessage(err) });
    } finally {
      setUploading(false);
    }
  }

  return (
    <View className="mb-3">
      <Label className="mb-1.5 text-xs text-muted-foreground">{label}</Label>
      {value ? (
        <View className="mb-2 flex-row items-center gap-3">
          <View
            className="overflow-hidden rounded-md border border-border bg-card"
            style={{ height: previewHeight, width: previewWidth }}
          >
            <ImageWithFallback source={value} tintSeed={value} />
          </View>
          <Pressable
            onPress={() => onChange("")}
            hitSlop={8}
            className="flex-row items-center gap-1"
          >
            <X size={14} color="#F87171" />
            <Text className="text-xs font-medium text-red-400">Remove</Text>
          </Pressable>
        </View>
      ) : null}
      <Pressable
        onPress={handlePick}
        disabled={uploading}
        className={`flex-row items-center justify-center gap-2 rounded-md bg-card px-3 py-2.5 ${
          uploading ? "opacity-60" : ""
        }`}
      >
        {uploading ? (
          <ActivityIndicator size="small" color="#46E3CE" />
        ) : (
          <Upload size={14} color="#46E3CE" />
        )}
        <Text className="text-sm text-foreground">
          {uploading ? "Uploading…" : buttonLabel}
        </Text>
      </Pressable>
    </View>
  );
}

function TabBody({
  loading,
  error,
  count,
  total,
  emptyLabel,
  children,
}: {
  loading: boolean;
  error: unknown;
  count: number;
  total: number;
  emptyLabel: string;
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <View className="items-center py-12">
        <ActivityIndicator color="#46E3CE" />
      </View>
    );
  }
  if (error) {
    return (
      <Text className="py-6 text-center text-sm text-red-400">
        Failed to load. {error instanceof Error ? error.message : ""}
      </Text>
    );
  }
  if (count === 0) {
    return (
      <Text className="py-6 text-center text-sm text-muted-foreground">
        {emptyLabel}.
      </Text>
    );
  }
  return (
    <>
      <Text className="mb-2 text-xs text-muted-foreground">
        {count} of {total}
      </Text>
      {children}
    </>
  );
}

function filterByQuery<T>(
  rows: T[],
  q: string,
  get: (r: T) => string[],
): T[] {
  const s = q.trim().toLowerCase();
  if (!s) return rows;
  return rows.filter((r) => get(r).some((v) => v.toLowerCase().includes(s)));
}

// Type imports referenced in JSX above (kept for IDE/type checker)
export type _ContentTypeRefs = Game | Team | Player | EsportsEvent | EventStatus;
