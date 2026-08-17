import * as React from "react";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";

import {
  CheckCircle2,
  Film,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from "@/components/icons";
import {
  adminDeleteClip,
  adminDeleteVod,
  adminRestoreClip,
  adminRestoreVod,
  createAdminClip,
  listAdminClips,
  listAdminVods,
  type AdminClip,
  type AdminVod,
  type CreateAdminClipPayload,
} from "@/lib/api/vods";
import { adminListShows } from "@/lib/api/shows-admin";
import { listGames } from "@/lib/api/games";
import {
  pickAndUploadImage,
  pickAndUploadVideo,
  uploadErrorMessage,
} from "@/lib/api/uploads";
import { useAuth } from "@/components/providers";
import { hasMinRole } from "@/lib/auth/roles";
import {
  CONTENT_PILLARS,
  MATURITY_LABELS,
  PILLAR_LABELS,
  type ContentPillar,
  type MaturityRating,
} from "@/lib/types";
import { ImageWithFallback } from "@/components/common/image-with-fallback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";

import { useTokens } from "@/lib/theme/tokens";

import { ListState } from "./list-state";
import { PageHeader } from "./page-header";
import { SectionLinks } from "./section-links";
import { StatusBadge } from "./status-badge";
import { formatDate } from "./utils";

/**
 * The library: uploaded videos, and the clips cut from them.
 *
 * This is the section landing, matching the website's Library page: both lists
 * in one place, with the pull and restore actions the website has. What it
 * deliberately does not do is re-implement the VODs and Clips screens the app
 * already has. Those own the deeper work (thumbnails, maturity ratings,
 * content tags, the video upload drawer) and are one tap away in the row of
 * links below the header. Building a second copy of them here is exactly the
 * complaint that started this rebuild.
 *
 * The one thing it adds is publishing a clip. Nothing in the app could write
 * one before, so the clips rail on the site could only ever be filled by
 * something else inserting rows.
 */

type Tab = "videos" | "clips";

const MATURITY_RATINGS: MaturityRating[] = ["kids", "pg", "teen", "mature"];

function formatDuration(sec: number): string {
  if (!sec) return "0:00";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function LibraryManagerPage() {
  const t = useTokens();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { role } = useAuth();
  // Moderators open this to see what is published. Publishing and pulling are
  // admin verbs on the API, so showing them those buttons would be a screen
  // full of controls that answer 403.
  const canPublish = hasMinRole(role, "admin");

  const [tab, setTab] = React.useState<Tab>("videos");
  const [search, setSearch] = React.useState("");
  const [showPulled, setShowPulled] = React.useState(false);
  const [clipDraftOpen, setClipDraftOpen] = React.useState(false);

  const vodsQ = useQuery({
    queryKey: ["admin-vods", { showPulled }],
    queryFn: () =>
      listAdminVods({
        deleted: showPulled ? "include" : undefined,
        limit: 200,
      }),
    staleTime: 30_000,
  });

  const clipsQ = useQuery({
    queryKey: ["admin-clips", { showPulled }],
    queryFn: () =>
      listAdminClips({
        deleted: showPulled ? "include" : undefined,
        limit: 200,
      }),
    staleTime: 30_000,
  });

  const showsQ = useQuery({
    queryKey: ["admin", "shows", "for-clips"],
    queryFn: () => adminListShows({ limit: 200 }),
    staleTime: 5 * 60_000,
  });

  const vods = vodsQ.data?.vods ?? [];
  const clips = clipsQ.data?.clips ?? [];
  const shows = showsQ.data?.shows ?? [];

  const showById = React.useMemo(
    () => new Map(shows.map((s) => [s.id, s])),
    [shows],
  );

  const filteredVods = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? vods.filter((v) => v.title.toLowerCase().includes(q)) : vods;
  }, [vods, search]);

  const filteredClips = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? clips.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.creatorHandle.toLowerCase().includes(q),
        )
      : clips;
  }, [clips, search]);

  const refresh = React.useCallback(
    (kind: "vod" | "clip") => {
      queryClient.invalidateQueries({
        queryKey: [kind === "vod" ? "admin-vods" : "admin-clips"],
      });
    },
    [queryClient],
  );

  const pull = useMutation({
    // Annotated down to what both branches share: the two endpoints name their
    // id field differently, and without this the union picks the VOD shape.
    mutationFn: async ({
      kind,
      id,
    }: {
      kind: "vod" | "clip";
      id: string;
    }): Promise<{ ok: true }> =>
      kind === "vod" ? adminDeleteVod(id) : adminDeleteClip(id),
    onSuccess: (_res, v) => {
      toast.success(v.kind === "vod" ? "Video pulled" : "Clip pulled");
      refresh(v.kind);
    },
    onError: (err) =>
      toast.error("Could not pull it", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  const restore = useMutation({
    mutationFn: async ({
      kind,
      id,
    }: {
      kind: "vod" | "clip";
      id: string;
    }): Promise<{ ok: true }> =>
      kind === "vod" ? adminRestoreVod(id) : adminRestoreClip(id),
    onSuccess: (_res, v) => {
      toast.success("Back on the site");
      refresh(v.kind);
    },
    onError: (err) =>
      toast.error("Could not restore it", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  const publishClip = useMutation({
    mutationFn: (payload: CreateAdminClipPayload) => createAdminClip(payload),
    onSuccess: () => {
      toast.success("Clip published");
      setClipDraftOpen(false);
      refresh("clip");
      queryClient.invalidateQueries({ queryKey: ["clips"] });
    },
    onError: (err) =>
      toast.error("Could not publish the clip", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  function confirmPull(kind: "vod" | "clip", id: string, label: string) {
    Alert.alert(
      "Pull this from the site?",
      `"${label}" stops being reachable. The row is kept and it can be restored from here.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pull it",
          style: "destructive",
          onPress: () => pull.mutate({ kind, id }),
        },
      ],
    );
  }

  function sourceLabel(clip: AdminClip): string {
    if (clip.showId) {
      const show = showById.get(clip.showId);
      const name = show ? show.title : "A show";
      return clip.episodeId ? `${name} · one episode` : name;
    }
    if (clip.vodId) return "A video";
    if (clip.streamId) return "A stream";
    return "Standalone";
  }

  const activeQuery = tab === "videos" ? vodsQ : clipsQ;
  const activeCount = tab === "videos" ? filteredVods.length : filteredClips.length;

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <PageHeader
          title="Library"
          description="Uploaded videos and the clips cut from them. Everything here is on the site the moment it saves."
          actions={
            canPublish && tab === "clips" ? (
              <Button className="bg-brand" onPress={() => setClipDraftOpen(true)}>
                <Plus size={14} color={t.bg} />
                <Text className="text-sm font-semibold text-background">
                  New clip
                </Text>
              </Button>
            ) : canPublish ? (
              <Button
                variant="secondary"
                onPress={() => router.push("/admin/vods" as never)}
              >
                <Text className="text-sm font-medium text-foreground">
                  Upload a video
                </Text>
              </Button>
            ) : null
          }
        />

        <SectionLinks parent="/admin/library" />

        <View className="mb-3 flex-row items-center gap-2">
          {(
            [
              ["videos", `Videos (${vods.length})`],
              ["clips", `Clips (${clips.length})`],
            ] as [Tab, string][]
          ).map(([value, label]) => {
            const on = tab === value;
            return (
              <Pressable
                key={value}
                onPress={() => setTab(value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                className={`rounded-lg px-3 py-2 active:opacity-70 ${
                  on ? "bg-brand/25" : "bg-card"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    on ? "text-brand" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="mb-3 flex-row items-center gap-2 rounded-lg bg-card px-3">
          <Search size={14} color={t.muted} />
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Search titles"
            className="h-10 flex-1 bg-transparent px-0"
          />
        </View>

        <View className="mb-4 flex-row items-center gap-2">
          <Switch checked={showPulled} onCheckedChange={setShowPulled} />
          <Text className="text-xs text-muted-foreground">Include pulled</Text>
          <Text className="ml-auto text-xs text-muted-foreground">
            {activeCount} shown
          </Text>
        </View>

        <ListState
          isPending={activeQuery.isPending}
          isError={activeQuery.isError}
          error={activeQuery.error}
          isEmpty={activeCount === 0}
          emptyMessage={
            search.trim()
              ? "Nothing matches that search."
              : tab === "videos"
                ? "No videos yet. Upload one and it appears on the site."
                : "No clips yet. Publish one and it appears in the clips rail."
          }
          onRetry={() => activeQuery.refetch()}
        />

        {tab === "videos"
          ? filteredVods.map((vod) => (
              <VideoRow
                key={vod.id}
                vod={vod}
                canPublish={canPublish}
                onOpen={() => router.push("/admin/vods" as never)}
                onPull={() => confirmPull("vod", vod.id, vod.title)}
                onRestore={() => restore.mutate({ kind: "vod", id: vod.id })}
              />
            ))
          : filteredClips.map((clip) => (
              <ClipRow
                key={clip.id}
                clip={clip}
                source={sourceLabel(clip)}
                canPublish={canPublish}
                onPull={() => confirmPull("clip", clip.id, clip.title)}
                onRestore={() => restore.mutate({ kind: "clip", id: clip.id })}
              />
            ))}
      </ScrollView>

      <NewClipSheet
        open={clipDraftOpen}
        submitting={publishClip.isPending}
        vods={vods}
        onClose={() => setClipDraftOpen(false)}
        onSubmit={(payload) => publishClip.mutate(payload)}
        shows={shows.map((s) => ({ id: s.id, title: s.title }))}
      />
    </View>
  );
}

function VideoRow({
  vod,
  canPublish,
  onOpen,
  onPull,
  onRestore,
}: {
  vod: AdminVod;
  canPublish: boolean;
  onOpen: () => void;
  onPull: () => void;
  onRestore: () => void;
}) {
  const t = useTokens();
  const pulled = Boolean(vod.deletedAt);
  return (
    <View className="mb-2 flex-row items-center gap-3 rounded-xl bg-card p-3">
      <View className="h-12 w-20 overflow-hidden rounded-lg bg-muted">
        <ImageWithFallback
          source={vod.thumbnailUrl}
          fallbackLabel={vod.title}
          tintSeed={vod.id}
          // The placeholder branch is a bare View, so it needs a size of its
          // own or it collapses inside its box.
          style={{ width: "100%", height: "100%" }}
        />
      </View>
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-sm font-medium text-foreground">
          {vod.title}
        </Text>
        <Text numberOfLines={1} className="text-xs text-muted-foreground">
          {formatDuration(vod.durationSec)} · {formatDate(vod.publishedAt)}
        </Text>
      </View>
      {pulled ? (
        <StatusBadge tone="red">Pulled</StatusBadge>
      ) : vod.isPremium ? (
        <StatusBadge tone="amber">Paid</StatusBadge>
      ) : null}
      {canPublish ? (
        pulled ? (
          <Pressable
            onPress={onRestore}
            hitSlop={8}
            accessibilityLabel={`Restore ${vod.title}`}
            className="rounded-lg bg-accent p-2 active:opacity-70"
          >
            <RotateCcw size={14} color={t.brand} />
          </Pressable>
        ) : (
          <View className="flex-row items-center gap-1">
            <Pressable
              onPress={onOpen}
              hitSlop={8}
              accessibilityLabel={`Configure ${vod.title}`}
              className="rounded-lg bg-accent px-2.5 py-2 active:opacity-70"
            >
              <Text className="text-xs font-semibold text-foreground">
                Configure
              </Text>
            </Pressable>
            <Pressable
              onPress={onPull}
              hitSlop={8}
              accessibilityLabel={`Pull ${vod.title}`}
              className="rounded-lg bg-accent p-2 active:opacity-70"
            >
              <Trash2 size={14} color={t.danger} />
            </Pressable>
          </View>
        )
      ) : null}
    </View>
  );
}

function ClipRow({
  clip,
  source,
  canPublish,
  onPull,
  onRestore,
}: {
  clip: AdminClip;
  source: string;
  canPublish: boolean;
  onPull: () => void;
  onRestore: () => void;
}) {
  const t = useTokens();
  const pulled = Boolean(clip.deletedAt);
  return (
    <View className="mb-2 flex-row items-center gap-3 rounded-xl bg-card p-3">
      <View className="h-12 w-20 overflow-hidden rounded-lg bg-muted">
        <ImageWithFallback
          source={clip.thumbnailUrl}
          fallbackLabel={clip.title}
          tintSeed={clip.id}
          style={{ width: "100%", height: "100%" }}
        />
      </View>
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-sm font-medium text-foreground">
          {clip.title}
        </Text>
        <Text numberOfLines={1} className="text-xs text-muted-foreground">
          @{clip.creatorHandle} · {formatDuration(clip.durationSec)}
        </Text>
        <Text numberOfLines={1} className="text-xs text-muted-foreground">
          Cut from {source}
        </Text>
      </View>
      {pulled ? <StatusBadge tone="red">Pulled</StatusBadge> : null}
      {canPublish ? (
        pulled ? (
          <Pressable
            onPress={onRestore}
            hitSlop={8}
            accessibilityLabel={`Restore ${clip.title}`}
            className="rounded-lg bg-accent p-2 active:opacity-70"
          >
            <RotateCcw size={14} color={t.brand} />
          </Pressable>
        ) : (
          <Pressable
            onPress={onPull}
            hitSlop={8}
            accessibilityLabel={`Pull ${clip.title}`}
            className="rounded-lg bg-accent p-2 active:opacity-70"
          >
            <Trash2 size={14} color={t.danger} />
          </Pressable>
        )
      ) : null}
    </View>
  );
}

/**
 * Publishing a clip.
 *
 * "Cut from" is the field that matters: attaching a clip to a show or a video
 * is what makes it appear next to that programme rather than only in the
 * general rail. Passing an episode is not offered here because the app has no
 * episode picker, and the API fills a clip's show in from its episode anyway.
 */
function NewClipSheet({
  open,
  submitting,
  vods,
  shows,
  onClose,
  onSubmit,
}: {
  open: boolean;
  submitting: boolean;
  vods: AdminVod[];
  shows: { id: string; title: string }[];
  onClose: () => void;
  onSubmit: (payload: CreateAdminClipPayload) => void;
}) {
  const t = useTokens();
  const [title, setTitle] = React.useState("");
  const [gameId, setGameId] = React.useState("");
  const [creatorHandle, setCreatorHandle] = React.useState("");
  const [source, setSource] = React.useState("none");
  const [mp4Url, setMp4Url] = React.useState("");
  const [thumbnailUrl, setThumbnailUrl] = React.useState("");
  const [durationInput, setDurationInput] = React.useState("");
  const [pillar, setPillar] = React.useState<ContentPillar>("esports");
  const [maturity, setMaturity] = React.useState<MaturityRating>("teen");
  const [uploadingVideo, setUploadingVideo] = React.useState(false);

  const gamesQ = useQuery({
    queryKey: ["games"],
    queryFn: listGames,
    staleTime: 60_000,
  });

  React.useEffect(() => {
    if (!open) return;
    setTitle("");
    setGameId("");
    setCreatorHandle("");
    setSource("none");
    setMp4Url("");
    setThumbnailUrl("");
    setDurationInput("");
    setPillar("esports");
    setMaturity("teen");
  }, [open]);

  async function handlePickVideo() {
    try {
      setUploadingVideo(true);
      const res = await pickAndUploadVideo();
      if (res) {
        setMp4Url(res.url);
        if (res.durationSec != null) setDurationInput(String(res.durationSec));
      }
    } catch (err) {
      toast.error("Clip upload failed", {
        description: uploadErrorMessage(err),
      });
    } finally {
      setUploadingVideo(false);
    }
  }

  const durationNum = Number.parseInt(durationInput, 10);
  const valid =
    title.trim().length >= 3 &&
    gameId.length > 0 &&
    mp4Url.length > 0 &&
    thumbnailUrl.length > 0 &&
    creatorHandle.trim().length > 0 &&
    Number.isFinite(durationNum) &&
    durationNum > 0;

  function handleSubmit() {
    const [kind, id] = source.split(":");
    onSubmit({
      title: title.trim(),
      gameId,
      mp4Url,
      thumbnailUrl,
      durationSec: durationNum,
      creatorHandle: creatorHandle.trim().replace(/^@/, ""),
      pillar,
      maturityRating: maturity,
      vodId: kind === "vod" ? id : null,
      showId: kind === "show" ? id : null,
    });
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/60">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="max-h-[92%] rounded-t-2xl bg-background"
        >
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="mb-4 flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-lg font-bold text-foreground">
                  New clip
                </Text>
                <Text className="mt-1 text-xs leading-5 text-muted-foreground">
                  A short cut. Attaching it to a show or a video is what makes it
                  show up next to that programme.
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
                <X size={20} color={t.muted} />
              </Pressable>
            </View>

            <SheetField label="Clip file">
              {mp4Url ? (
                <View className="mb-2 flex-row items-center gap-2 rounded-lg bg-brand/25 px-3 py-2.5">
                  <CheckCircle2 size={14} color={t.brand} />
                  <Text
                    numberOfLines={1}
                    className="min-w-0 flex-1 text-xs font-medium text-brand"
                  >
                    Clip uploaded
                  </Text>
                  <Pressable onPress={() => setMp4Url("")} hitSlop={8}>
                    <X size={14} color={t.danger} />
                  </Pressable>
                </View>
              ) : null}
              <Pressable
                onPress={handlePickVideo}
                disabled={uploadingVideo}
                className={`flex-row items-center justify-center gap-2 rounded-lg bg-card px-3 py-2.5 ${
                  uploadingVideo ? "opacity-60" : ""
                }`}
              >
                {uploadingVideo ? (
                  <Spinner size="small" />
                ) : (
                  <Film size={14} color={t.brand} />
                )}
                <Text className="text-sm text-foreground">
                  {uploadingVideo
                    ? "Uploading…"
                    : mp4Url
                      ? "Replace clip"
                      : "Upload clip"}
                </Text>
              </Pressable>
            </SheetField>

            <SheetField label="Thumbnail">
              {thumbnailUrl ? (
                <View className="mb-2 flex-row items-center gap-3">
                  <View
                    className="overflow-hidden rounded-lg bg-card"
                    style={{ height: 72, width: 128 }}
                  >
                    <ImageWithFallback
                      source={thumbnailUrl}
                      tintSeed={thumbnailUrl}
                      style={{ width: "100%", height: "100%" }}
                    />
                  </View>
                  <Pressable
                    onPress={() => setThumbnailUrl("")}
                    hitSlop={8}
                    className="flex-row items-center gap-1"
                  >
                    <X size={14} color={t.danger} />
                    <Text className="text-xs font-medium text-destructive">
                      Remove
                    </Text>
                  </Pressable>
                </View>
              ) : null}
              <UploadImageButton
                label={thumbnailUrl ? "Replace thumbnail" : "Upload thumbnail"}
                onUploaded={setThumbnailUrl}
              />
            </SheetField>

            <SheetField label="Title">
              <Input
                value={title}
                onChangeText={setTitle}
                placeholder="Clutch to win the map"
                className="bg-card"
              />
            </SheetField>

            <SheetField label="Cut from">
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="bg-card">
                  <SelectValue placeholder="Nothing, it stands alone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nothing, it stands alone</SelectItem>
                  {shows.map((show) => (
                    <SelectItem key={show.id} value={`show:${show.id}`}>
                      Show: {show.title}
                    </SelectItem>
                  ))}
                  {vods.map((vod) => (
                    <SelectItem key={vod.id} value={`vod:${vod.id}`}>
                      Video: {vod.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SheetField>

            <SheetField label="Game">
              <Select value={gameId} onValueChange={setGameId}>
                <SelectTrigger className="bg-card">
                  <SelectValue
                    placeholder={
                      gamesQ.isPending ? "Loading games…" : "Pick a game"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(gamesQ.data ?? []).map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {gamesQ.isError ? (
                <Text className="mt-1 text-xs text-destructive">
                  The game list did not load. A clip needs one, so try again.
                </Text>
              ) : null}
            </SheetField>

            <SheetField label="Creator handle">
              <Input
                value={creatorHandle}
                onChangeText={setCreatorHandle}
                autoCapitalize="none"
                placeholder="evotv"
                className="bg-card"
              />
            </SheetField>

            <SheetField label="Length, seconds">
              <Input
                value={durationInput}
                onChangeText={setDurationInput}
                keyboardType="number-pad"
                placeholder="45"
                className="bg-card"
              />
            </SheetField>

            <View className="mb-3 flex-row gap-3">
              <View className="flex-1">
                <Label className="mb-1.5 text-xs text-muted-foreground">
                  Pillar
                </Label>
                <Select
                  value={pillar}
                  onValueChange={(v) => setPillar(v as ContentPillar)}
                >
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="Pillar" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_PILLARS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PILLAR_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </View>
              <View className="flex-1">
                <Label className="mb-1.5 text-xs text-muted-foreground">
                  Maturity
                </Label>
                <Select
                  value={maturity}
                  onValueChange={(v) => setMaturity(v as MaturityRating)}
                >
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="Maturity" />
                  </SelectTrigger>
                  <SelectContent>
                    {MATURITY_RATINGS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {MATURITY_LABELS[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </View>
            </View>

            <View className="mt-3 flex-row gap-2">
              <Button variant="secondary" className="flex-1" onPress={onClose}>
                <Text className="text-sm font-medium text-foreground">
                  Cancel
                </Text>
              </Button>
              <Button
                disabled={!valid || submitting || uploadingVideo}
                className="flex-1 bg-brand"
                onPress={handleSubmit}
              >
                <Text className="text-sm font-semibold text-background">
                  {submitting ? "Publishing…" : "Publish clip"}
                </Text>
              </Button>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function UploadImageButton({
  label,
  onUploaded,
}: {
  label: string;
  onUploaded: (url: string) => void;
}) {
  const t = useTokens();
  const [uploading, setUploading] = React.useState(false);

  async function handlePick() {
    try {
      setUploading(true);
      const url = await pickAndUploadImage();
      if (url) onUploaded(url);
    } catch (err) {
      toast.error("Upload failed", { description: uploadErrorMessage(err) });
    } finally {
      setUploading(false);
    }
  }

  return (
    <Pressable
      onPress={handlePick}
      disabled={uploading}
      className={`flex-row items-center justify-center gap-2 rounded-lg bg-card px-3 py-2.5 ${
        uploading ? "opacity-60" : ""
      }`}
    >
      {uploading ? <Spinner size="small" /> : <Upload size={14} color={t.brand} />}
      <Text className="text-sm text-foreground">
        {uploading ? "Uploading…" : label}
      </Text>
    </Pressable>
  );
}

function SheetField({
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
