import * as React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Plus, Search, Trash2, X } from "lucide-react-native";
import { toast } from "sonner-native";

import { games as gamesSource } from "@/lib/mock/games";
import { teams as teamsSource } from "@/lib/mock/teams";
import { players as playersSource } from "@/lib/mock/players";
import { events as eventsSource } from "@/lib/mock/events";
import type {
  EsportsEvent,
  EventStatus,
  EventTier,
  Game,
  Player,
  Team,
} from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { formatDate, formatNgn, formatNumber } from "./utils";

type ContentTab = "games" | "teams" | "players" | "events";

export function ContentManagerPage() {
  const [tab, setTab] = React.useState<ContentTab>("games");

  const [games, setGames] = React.useState<Game[]>(() => [...gamesSource]);
  const [teams, setTeams] = React.useState<Team[]>(() => [...teamsSource]);
  const [players, setPlayers] = React.useState<Player[]>(() => [
    ...playersSource,
  ]);
  const [events, setEvents] = React.useState<EsportsEvent[]>(() => [
    ...eventsSource,
  ]);

  const [search, setSearch] = React.useState("");
  const [editing, setEditing] = React.useState<
    | { kind: "game"; row: Game | null }
    | { kind: "team"; row: Team | null }
    | { kind: "player"; row: Player | null }
    | { kind: "event"; row: EsportsEvent | null }
    | null
  >(null);
  const [confirmDelete, setConfirmDelete] = React.useState<{
    kind: ContentTab;
    id: string;
    label: string;
  } | null>(null);

  const handleDelete = () => {
    if (!confirmDelete) return;
    const { kind, id, label } = confirmDelete;
    if (kind === "games") setGames((p) => p.filter((x) => x.id !== id));
    if (kind === "teams") setTeams((p) => p.filter((x) => x.id !== id));
    if (kind === "players") setPlayers((p) => p.filter((x) => x.id !== id));
    if (kind === "events") setEvents((p) => p.filter((x) => x.id !== id));
    toast.success(`Deleted "${label}"`);
    setConfirmDelete(null);
  };

  const filteredGames = filterByQuery(games, search, (r) => [
    r.name,
    r.slug,
    r.shortName,
  ]);
  const filteredTeams = filterByQuery(teams, search, (r) => [
    r.name,
    r.slug,
    r.tag,
  ]);
  const filteredPlayers = filterByQuery(players, search, (r) => [
    r.handle,
    r.realName,
  ]);
  const filteredEvents = filterByQuery(events, search, (r) => [
    r.title,
    r.slug,
    r.format,
  ]);

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <PageHeader
          title="Content"
          description="Manage games, teams, players and esports events."
          actions={
            <Button
              className="bg-cyan-500"
              onPress={() => {
                if (tab === "games") setEditing({ kind: "game", row: null });
                if (tab === "teams") setEditing({ kind: "team", row: null });
                if (tab === "players")
                  setEditing({ kind: "player", row: null });
                if (tab === "events") setEditing({ kind: "event", row: null });
              }}
            >
              <Plus size={14} color="#000" />
              <Text className="text-sm font-medium text-black">New</Text>
            </Button>
          }
        />

        <Tabs value={tab} onValueChange={(v) => setTab(v as ContentTab)}>
          <TabsList className="mb-3">
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <View className="mb-3 flex-row items-center gap-2 rounded-md border border-border bg-card px-3">
            <Search size={14} color="#A3A3A3" />
            <Input
              value={search}
              onChangeText={setSearch}
              placeholder={`Search ${tab}…`}
              className="h-9 flex-1 border-0 bg-transparent px-0"
            />
          </View>

          <TabsContent value="games">
            {filteredGames.map((row) => (
              <Pressable
                key={row.id}
                onPress={() => setEditing({ kind: "game", row })}
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
                  <View className="mt-1 flex-row gap-1.5">
                    <StatusBadge tone="violet">
                      {row.category.toUpperCase()}
                    </StatusBadge>
                    <StatusBadge tone="neutral">{row.platform}</StatusBadge>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-xs text-muted-foreground">Players</Text>
                  <Text className="text-sm text-foreground">
                    {formatNumber(row.activePlayers)}
                  </Text>
                </View>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    setConfirmDelete({
                      kind: "games",
                      id: row.id,
                      label: row.name,
                    });
                  }}
                  hitSlop={8}
                >
                  <Trash2 size={16} color="#A3A3A3" />
                </Pressable>
              </Pressable>
            ))}
          </TabsContent>

          <TabsContent value="teams">
            {filteredTeams.map((row) => (
              <Pressable
                key={row.id}
                onPress={() => setEditing({ kind: "team", row })}
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
                    {gamesSource.find((g) => g.id === row.gameId)?.shortName ??
                      "—"}{" "}
                    · {row.region} · #{row.ranking}
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
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    setConfirmDelete({
                      kind: "teams",
                      id: row.id,
                      label: row.name,
                    });
                  }}
                  hitSlop={8}
                >
                  <Trash2 size={16} color="#A3A3A3" />
                </Pressable>
              </Pressable>
            ))}
          </TabsContent>

          <TabsContent value="players">
            {filteredPlayers.map((row) => (
              <Pressable
                key={row.id}
                onPress={() => setEditing({ kind: "player", row })}
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
                    {row.handle}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {row.realName}
                  </Text>
                  <View className="mt-1 flex-row gap-1.5">
                    <StatusBadge tone="neutral">{row.role}</StatusBadge>
                    <StatusBadge tone="neutral">{row.country}</StatusBadge>
                  </View>
                </View>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    setConfirmDelete({
                      kind: "players",
                      id: row.id,
                      label: row.handle,
                    });
                  }}
                  hitSlop={8}
                >
                  <Trash2 size={16} color="#A3A3A3" />
                </Pressable>
              </Pressable>
            ))}
          </TabsContent>

          <TabsContent value="events">
            {filteredEvents.map((row) => {
              const tone =
                row.tier === "s"
                  ? ("amber" as const)
                  : row.tier === "a"
                    ? ("emerald" as const)
                    : row.tier === "b"
                      ? ("blue" as const)
                      : ("neutral" as const);
              const statusTone: "red" | "amber" | "emerald" | "neutral" =
                row.status === "live"
                  ? "red"
                  : row.status === "scheduled"
                    ? "amber"
                    : row.status === "completed"
                      ? "emerald"
                      : "neutral";
              return (
                <Pressable
                  key={row.id}
                  onPress={() => setEditing({ kind: "event", row })}
                  className="mb-2 rounded-xl border border-border bg-card/40 p-3"
                >
                  <View className="flex-row items-start gap-3">
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground">
                        {row.title}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        {row.format}
                      </Text>
                      <View className="mt-1 flex-row flex-wrap gap-1.5">
                        <StatusBadge tone={tone}>
                          Tier {row.tier.toUpperCase()}
                        </StatusBadge>
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
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        setConfirmDelete({
                          kind: "events",
                          id: row.id,
                          label: row.title,
                        });
                      }}
                      hitSlop={8}
                    >
                      <Trash2 size={16} color="#A3A3A3" />
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </TabsContent>
        </Tabs>
      </ScrollView>

      {editing ? (
        <SimpleEditModal
          editing={editing}
          onClose={() => setEditing(null)}
          onSaveGame={(g) => {
            setGames((prev) => {
              const exists = prev.some((x) => x.id === g.id);
              return exists
                ? prev.map((x) => (x.id === g.id ? g : x))
                : [g, ...prev];
            });
            toast.success("Game saved");
            setEditing(null);
          }}
          onSaveTeam={(t) => {
            setTeams((prev) => {
              const exists = prev.some((x) => x.id === t.id);
              return exists
                ? prev.map((x) => (x.id === t.id ? t : x))
                : [t, ...prev];
            });
            toast.success("Team saved");
            setEditing(null);
          }}
          onSavePlayer={(p) => {
            setPlayers((prev) => {
              const exists = prev.some((x) => x.id === p.id);
              return exists
                ? prev.map((x) => (x.id === p.id ? p : x))
                : [p, ...prev];
            });
            toast.success("Player saved");
            setEditing(null);
          }}
          onSaveEvent={(e) => {
            setEvents((prev) => {
              const exists = prev.some((x) => x.id === e.id);
              return exists
                ? prev.map((x) => (x.id === e.id ? e : x))
                : [e, ...prev];
            });
            toast.success("Event saved");
            setEditing(null);
          }}
        />
      ) : null}

      <Dialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {confirmDelete?.kind.slice(0, -1)}?</DialogTitle>
            <DialogDescription>
              This will permanently delete "{confirmDelete?.label}".
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

function filterByQuery<T>(
  rows: T[],
  q: string,
  get: (r: T) => string[],
): T[] {
  const s = q.trim().toLowerCase();
  if (!s) return rows;
  return rows.filter((r) => get(r).some((v) => v.toLowerCase().includes(s)));
}

function SimpleEditModal({
  editing,
  onClose,
  onSaveGame,
  onSaveTeam,
  onSavePlayer,
  onSaveEvent,
}: {
  editing:
    | { kind: "game"; row: Game | null }
    | { kind: "team"; row: Team | null }
    | { kind: "player"; row: Player | null }
    | { kind: "event"; row: EsportsEvent | null };
  onClose: () => void;
  onSaveGame: (g: Game) => void;
  onSaveTeam: (t: Team) => void;
  onSavePlayer: (p: Player) => void;
  onSaveEvent: (e: EsportsEvent) => void;
}) {
  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/50">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="max-h-[92%] rounded-t-2xl border border-border bg-background"
        >
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View className="mb-4 flex-row items-start justify-between">
              <Text className="text-lg font-semibold text-foreground">
                {editing.row ? `Edit ${editing.kind}` : `New ${editing.kind}`}
              </Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <X size={20} color="#A3A3A3" />
              </Pressable>
            </View>

            {editing.kind === "game" ? (
              <GameForm
                initial={editing.row}
                onSave={onSaveGame}
                onCancel={onClose}
              />
            ) : null}
            {editing.kind === "team" ? (
              <TeamForm
                initial={editing.row}
                onSave={onSaveTeam}
                onCancel={onClose}
              />
            ) : null}
            {editing.kind === "player" ? (
              <PlayerForm
                initial={editing.row}
                onSave={onSavePlayer}
                onCancel={onClose}
              />
            ) : null}
            {editing.kind === "event" ? (
              <EventForm
                initial={editing.row}
                onSave={onSaveEvent}
                onCancel={onClose}
              />
            ) : null}
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

function GameForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Game | null;
  onSave: (g: Game) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = React.useState<Game>(
    initial ?? {
      id: `game_new_${Date.now()}`,
      slug: "",
      name: "",
      shortName: "",
      coverUrl: "/placeholder.svg?height=400&width=800&text=Cover",
      iconUrl: "/placeholder.svg?height=80&width=80&text=New",
      category: "fps",
      platform: "mobile",
      activePlayers: 0,
    },
  );
  const disabled = !form.name.trim() || !form.slug.trim();
  return (
    <View>
      <Field label="Slug">
        <Input
          value={form.slug}
          onChangeText={(slug) => setForm({ ...form, slug })}
          className="bg-card"
        />
      </Field>
      <Field label="Name">
        <Input
          value={form.name}
          onChangeText={(name) => setForm({ ...form, name })}
          className="bg-card"
        />
      </Field>
      <Field label="Short name">
        <Input
          value={form.shortName}
          onChangeText={(shortName) => setForm({ ...form, shortName })}
          className="bg-card"
        />
      </Field>
      <Field label="Active players">
        <Input
          value={String(form.activePlayers)}
          onChangeText={(v) =>
            setForm({ ...form, activePlayers: Number(v) || 0 })
          }
          keyboardType="numeric"
          className="bg-card"
        />
      </Field>
      <View className="mt-3 flex-row gap-2">
        <Button variant="outline" className="flex-1" onPress={onCancel}>
          <Text className="text-sm text-foreground">Cancel</Text>
        </Button>
        <Button
          disabled={disabled}
          className="flex-1 bg-cyan-500"
          onPress={() => onSave(form)}
        >
          <Text className="text-sm font-medium text-black">Save</Text>
        </Button>
      </View>
    </View>
  );
}

function TeamForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Team | null;
  onSave: (t: Team) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = React.useState<Team>(
    initial ?? {
      id: `team_new_${Date.now()}`,
      slug: "",
      name: "",
      tag: "",
      logoUrl: "/placeholder.svg?height=120&width=120&text=NEW",
      country: "NG",
      region: "West Africa",
      gameId: gamesSource[0]?.id ?? "",
      ranking: 99,
      followers: 0,
      wins: 0,
      losses: 0,
    },
  );
  const disabled = !form.name.trim() || !form.tag.trim() || !form.slug.trim();
  return (
    <View>
      <Field label="Slug">
        <Input
          value={form.slug}
          onChangeText={(slug) => setForm({ ...form, slug })}
          className="bg-card"
        />
      </Field>
      <Field label="Tag">
        <Input
          value={form.tag}
          onChangeText={(tag) => setForm({ ...form, tag })}
          className="bg-card"
        />
      </Field>
      <Field label="Name">
        <Input
          value={form.name}
          onChangeText={(name) => setForm({ ...form, name })}
          className="bg-card"
        />
      </Field>
      <Field label="Country">
        <Input
          value={form.country}
          onChangeText={(country) => setForm({ ...form, country })}
          className="bg-card"
        />
      </Field>
      <Field label="Region">
        <Input
          value={form.region}
          onChangeText={(region) => setForm({ ...form, region })}
          className="bg-card"
        />
      </Field>
      <Field label="Ranking">
        <Input
          value={String(form.ranking)}
          onChangeText={(v) => setForm({ ...form, ranking: Number(v) || 0 })}
          keyboardType="numeric"
          className="bg-card"
        />
      </Field>
      <Field label="Followers">
        <Input
          value={String(form.followers)}
          onChangeText={(v) =>
            setForm({ ...form, followers: Number(v) || 0 })
          }
          keyboardType="numeric"
          className="bg-card"
        />
      </Field>
      <View className="mt-3 flex-row gap-2">
        <Button variant="outline" className="flex-1" onPress={onCancel}>
          <Text className="text-sm text-foreground">Cancel</Text>
        </Button>
        <Button
          disabled={disabled}
          className="flex-1 bg-cyan-500"
          onPress={() => onSave(form)}
        >
          <Text className="text-sm font-medium text-black">Save</Text>
        </Button>
      </View>
    </View>
  );
}

function PlayerForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Player | null;
  onSave: (p: Player) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = React.useState<Player>(
    initial ?? {
      id: `player_new_${Date.now()}`,
      handle: "",
      realName: "",
      avatarUrl: "/placeholder.svg?height=96&width=96&text=NEW",
      teamId: null,
      gameId: gamesSource[0]?.id ?? "",
      role: "IGL",
      country: "NG",
      kda: 1.5,
      followers: 0,
    },
  );
  const disabled = !form.handle.trim();
  return (
    <View>
      <Field label="Handle">
        <Input
          value={form.handle}
          onChangeText={(handle) => setForm({ ...form, handle })}
          className="bg-card"
        />
      </Field>
      <Field label="Real name">
        <Input
          value={form.realName}
          onChangeText={(realName) => setForm({ ...form, realName })}
          className="bg-card"
        />
      </Field>
      <Field label="Role">
        <Input
          value={form.role}
          onChangeText={(role) => setForm({ ...form, role })}
          className="bg-card"
        />
      </Field>
      <Field label="Country">
        <Input
          value={form.country}
          onChangeText={(country) => setForm({ ...form, country })}
          className="bg-card"
        />
      </Field>
      <View className="mt-3 flex-row gap-2">
        <Button variant="outline" className="flex-1" onPress={onCancel}>
          <Text className="text-sm text-foreground">Cancel</Text>
        </Button>
        <Button
          disabled={disabled}
          className="flex-1 bg-cyan-500"
          onPress={() => onSave(form)}
        >
          <Text className="text-sm font-medium text-black">Save</Text>
        </Button>
      </View>
    </View>
  );
}

function EventForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: EsportsEvent | null;
  onSave: (e: EsportsEvent) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = React.useState<EsportsEvent>(
    initial ?? {
      id: `event_new_${Date.now()}`,
      slug: "",
      title: "",
      gameId: gamesSource[0]?.id ?? "",
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 86_400_000).toISOString(),
      status: "scheduled",
      tier: "b",
      bannerUrl: "/placeholder.svg?height=600&width=1600&text=Banner",
      thumbnailUrl: "/placeholder.svg?height=400&width=600&text=Thumb",
      description: "",
      prizePoolNgn: 0,
      teamIds: [],
      region: "Africa",
      format: "",
    },
  );
  const disabled = !form.title.trim() || !form.slug.trim();

  return (
    <View>
      <Field label="Slug">
        <Input
          value={form.slug}
          onChangeText={(slug) => setForm({ ...form, slug })}
          className="bg-card"
        />
      </Field>
      <Field label="Title">
        <Input
          value={form.title}
          onChangeText={(title) => setForm({ ...form, title })}
          className="bg-card"
        />
      </Field>
      <Field label="Region">
        <Input
          value={form.region}
          onChangeText={(region) => setForm({ ...form, region })}
          className="bg-card"
        />
      </Field>
      <Field label="Format">
        <Input
          value={form.format}
          onChangeText={(format) => setForm({ ...form, format })}
          placeholder="Single elimination, Bo3"
          className="bg-card"
        />
      </Field>
      <Field label="Tier">
        <View className="flex-row gap-1.5">
          {(["s", "a", "b", "c"] as EventTier[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setForm({ ...form, tier: t })}
              className={`rounded-md border px-3 py-1.5 ${
                form.tier === t
                  ? "border-cyan-500 bg-cyan-500/10"
                  : "border-border bg-card"
              }`}
            >
              <Text
                className={`text-xs ${
                  form.tier === t
                    ? "text-cyan-300"
                    : "text-muted-foreground"
                }`}
              >
                Tier {t.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      </Field>
      <Field label="Status">
        <View className="flex-row gap-1.5">
          {(
            ["scheduled", "live", "completed", "cancelled"] as EventStatus[]
          ).map((s) => (
            <Pressable
              key={s}
              onPress={() => setForm({ ...form, status: s })}
              className={`rounded-md border px-2 py-1 ${
                form.status === s
                  ? "border-cyan-500 bg-cyan-500/10"
                  : "border-border bg-card"
              }`}
            >
              <Text
                className={`text-[10px] ${
                  form.status === s
                    ? "text-cyan-300"
                    : "text-muted-foreground"
                }`}
              >
                {s}
              </Text>
            </Pressable>
          ))}
        </View>
      </Field>
      <Field label="Prize pool (NGN)">
        <Input
          value={String(form.prizePoolNgn)}
          onChangeText={(v) =>
            setForm({ ...form, prizePoolNgn: Number(v) || 0 })
          }
          keyboardType="numeric"
          className="bg-card"
        />
      </Field>
      <View className="mt-3 flex-row gap-2">
        <Button variant="outline" className="flex-1" onPress={onCancel}>
          <Text className="text-sm text-foreground">Cancel</Text>
        </Button>
        <Button
          disabled={disabled}
          className="flex-1 bg-cyan-500"
          onPress={() => onSave(form)}
        >
          <Text className="text-sm font-medium text-black">Save</Text>
        </Button>
      </View>
    </View>
  );
}
