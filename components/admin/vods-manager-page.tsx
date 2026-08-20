import * as React from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";

import {
  adminDeleteVod,
  adminRestoreVod,
  adminUpdateVod,
  createAdminVod,
  listAdminVods,
  type AdminVod,
  type CreateAdminVodPayload,
} from "@/lib/api/vods";
import { listGames } from "@/lib/api/games";
import {
  pickAndUploadImage,
  pickAndUploadVideo,
  uploadErrorMessage,
} from "@/lib/api/uploads";
import { ImageWithFallback } from "@/components/common/image-with-fallback";
import {
  CONTENT_PILLARS,
  MATURITY_LABELS,
  PILLAR_LABELS,
  type ContentPillar,
  type MaturityRating,
} from "@/lib/types";
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

import { PageHeader } from "./page-header";
import { HowTo } from "./how-to";
import { StatusBadge } from "./status-badge";
import { ContentTagsEditor, MaturityEditor } from "./content-meta-editors";
import { formatCompact, formatDate } from "./utils";

type Filter = "active" | "deleted";

const MATURITY_RATINGS: MaturityRating[] = ["kids", "pg", "teen", "mature"];

export function VodsManagerPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("active");
  const [selected, setSelected] = React.useState<AdminVod | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);

  const vodsQ = useQuery({
    queryKey: ["admin-vods", filter],
    queryFn: () =>
      listAdminVods({
        deleted: filter === "deleted" ? "only" : undefined,
        limit: 200,
      }),
    staleTime: 30_000,
  });

  const deleteMut = useMutation({
    mutationFn: (vod: AdminVod) => adminDeleteVod(vod.id),
    onSuccess: () => {
      toast.success("VOD deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-vods"] });
      setSelected(null);
    },
    onError: (err) =>
      toast.error("Couldn't delete VOD", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  const restoreMut = useMutation({
    mutationFn: (vod: AdminVod) => adminRestoreVod(vod.id),
    onSuccess: () => {
      toast.success("VOD restored");
      queryClient.invalidateQueries({ queryKey: ["admin-vods"] });
      setSelected(null);
    },
    onError: (err) =>
      toast.error("Couldn't restore VOD", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  const maturityMut = useMutation({
    mutationFn: (args: { id: string; maturityRating: MaturityRating | null }) =>
      adminUpdateVod(args.id, { maturityRating: args.maturityRating }),
    onSuccess: (_res, args) => {
      toast.success("Maturity rating updated");
      queryClient.invalidateQueries({ queryKey: ["admin-vods"] });
      setSelected((prev) =>
        prev && prev.id === args.id
          ? { ...prev, maturityRating: args.maturityRating ?? undefined }
          : prev,
      );
    },
    onError: (err) =>
      toast.error("Couldn't set maturity rating", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  const tagsMut = useMutation({
    mutationFn: (args: { id: string; contentTags: string[] }) =>
      adminUpdateVod(args.id, { contentTags: args.contentTags }),
    onSuccess: (_res, args) => {
      toast.success("Content tags updated");
      queryClient.invalidateQueries({ queryKey: ["admin-vods"] });
      setSelected((prev) =>
        prev && prev.id === args.id
          ? { ...prev, contentTags: args.contentTags }
          : prev,
      );
    },
    onError: (err) =>
      toast.error("Couldn't set content tags", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  const thumbMut = useMutation({
    mutationFn: (args: { id: string; thumbnailUrl: string }) =>
      adminUpdateVod(args.id, { thumbnailUrl: args.thumbnailUrl }),
    onSuccess: (_res, args) => {
      toast.success("Thumbnail updated");
      queryClient.invalidateQueries({ queryKey: ["admin-vods"] });
      queryClient.invalidateQueries({ queryKey: ["vods"] });
      setSelected((prev) =>
        prev && prev.id === args.id
          ? { ...prev, thumbnailUrl: args.thumbnailUrl }
          : prev,
      );
    },
    onError: (err) =>
      toast.error("Couldn't update thumbnail", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  const createMut = useMutation({
    mutationFn: (payload: CreateAdminVodPayload) => createAdminVod(payload),
    onSuccess: () => {
      toast.success("VOD created");
      queryClient.invalidateQueries({ queryKey: ["admin-vods"] });
      queryClient.invalidateQueries({ queryKey: ["vods"] });
      setCreateOpen(false);
    },
    onError: (err) =>
      toast.error("Couldn't create VOD", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  const vods = vodsQ.data?.vods ?? [];
  const filtered = React.useMemo(() => {
    if (!search.trim()) return vods;
    const q = search.toLowerCase();
    return vods.filter((v) => v.title.toLowerCase().includes(q));
  }, [vods, search]);

  function handleDelete(vod: AdminVod) {
    Alert.alert(
      "Delete VOD?",
      `Soft-deletes "${vod.title}" - disappears from all public lists. Recoverable within 30 days.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteMut.mutate(vod) },
      ],
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <PageHeader
          title="VODs"
          description="All recorded videos. Filter for deleted to restore."
          actions={
            <Button className="bg-cyan-500" onPress={() => setCreateOpen(true)}>
              <Plus size={14} color="#000" />
              <Text className="text-sm font-medium text-black">New VOD</Text>
            </Button>
          }
        />
        <HowTo page="library" />

        <View className="mb-3 flex-row items-center gap-2 rounded-md border border-border bg-card px-3">
          <Search size={14} color="#9FBDBD" />
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Search by title"
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
            {vodsQ.data?.total && filtered.length !== vodsQ.data.total
              ? ` of ${vodsQ.data.total}`
              : ""}
          </Text>
        </View>

        {vodsQ.isLoading ? (
          <View className="items-center py-8">
            <Spinner size="large" />
          </View>
        ) : filtered.length === 0 ? (
          <View className="items-center rounded-xl bg-card/50 p-8">
            <Text className="text-sm text-muted-foreground">
              No {filter === "deleted" ? "deleted VODs" : "VODs"}.
            </Text>
          </View>
        ) : (
          filtered.map((vod) => (
            <Pressable
              key={vod.id}
              onPress={() => setSelected(vod)}
              className="mb-2 flex-row items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <View className="h-12 w-20 overflow-hidden rounded bg-muted">
                <Image
                  source={vod.thumbnailUrl}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              </View>
              <View className="min-w-0 flex-1">
                <Text
                  numberOfLines={1}
                  className="text-sm font-medium text-foreground"
                >
                  {vod.title}
                </Text>
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                  {formatCompact(vod.viewCount ?? 0)} views ·{" "}
                  {formatDate(vod.publishedAt)}
                </Text>
              </View>
              {vod.deletedAt ? (
                <StatusBadge tone="red">Deleted</StatusBadge>
              ) : vod.isPremium ? (
                <StatusBadge tone="amber">Premium</StatusBadge>
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
                      Published {formatDate(selected.publishedAt)}
                    </Text>
                  </View>
                  <Pressable onPress={() => setSelected(null)} hitSlop={8}>
                    <X size={20} color="#9FBDBD" />
                  </Pressable>
                </View>

                <View className="mb-2 overflow-hidden rounded-lg border border-border bg-card">
                  <ImageWithFallback
                    source={selected.thumbnailUrl}
                    style={{ width: "100%", aspectRatio: 16 / 9 }}
                    contentFit="cover"
                    fallbackLabel={selected.title}
                    tintSeed={selected.id}
                  />
                </View>

                <UploadImageButton
                  label="Upload new thumbnail"
                  pending={thumbMut.isPending}
                  onUploaded={(url) =>
                    thumbMut.mutate({ id: selected.id, thumbnailUrl: url })
                  }
                />

                {selected.description ? (
                  <View className="mb-3 rounded-md border border-border bg-card/40 p-3">
                    <Text className="text-xs text-foreground">
                      {selected.description}
                    </Text>
                  </View>
                ) : null}

                <MaturityEditor
                  current={selected.maturityRating}
                  isPending={maturityMut.isPending}
                  onPick={(rating) =>
                    maturityMut.mutate({ id: selected.id, maturityRating: rating })
                  }
                  onClear={() =>
                    maturityMut.mutate({ id: selected.id, maturityRating: null })
                  }
                />

                <ContentTagsEditor
                  current={selected.contentTags}
                  isPending={tagsMut.isPending}
                  onSave={(contentTags) =>
                    tagsMut.mutate({ id: selected.id, contentTags })
                  }
                />

                <View className="mt-3">
                  {selected.deletedAt ? (
                    <Pressable
                      onPress={() => restoreMut.mutate(selected)}
                      disabled={restoreMut.isPending}
                      className="flex-row items-center justify-center gap-2 rounded-lg bg-emerald-500/20 bg-emerald-500/15 px-3 py-3"
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
                      className="flex-row items-center justify-center gap-2 rounded-lg bg-destructive/20 bg-destructive/15 px-3 py-3"
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

      <NewVodDrawer
        open={createOpen}
        submitting={createMut.isPending}
        onClose={() => setCreateOpen(false)}
        onSubmit={(payload) => createMut.mutate(payload)}
      />
    </View>
  );
}

/**
 * Bottom-sheet form for publishing a new VOD from uploaded media. Mirrors the
 * GameDrawer pattern in content-manager-page.tsx: slide-up Modal, Field rows,
 * Cancel/Create footer. Media is upload-only (no URL pasting): the video goes
 * through the presigned client-upload flow (up to 512 MB), the thumbnail
 * through the small-file admin upload endpoint.
 */
function NewVodDrawer({
  open,
  submitting,
  onClose,
  onSubmit,
}: {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateAdminVodPayload) => void;
}) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [gameId, setGameId] = React.useState("");
  const [pillar, setPillar] = React.useState<ContentPillar>("esports");
  const [maturity, setMaturity] = React.useState<MaturityRating>("teen");
  const [isPremium, setIsPremium] = React.useState(false);
  const [mp4Url, setMp4Url] = React.useState("");
  const [videoDurationSec, setVideoDurationSec] = React.useState<number | null>(
    null,
  );
  const [durationInput, setDurationInput] = React.useState("");
  const [thumbnailUrl, setThumbnailUrl] = React.useState("");
  const [uploadingVideo, setUploadingVideo] = React.useState(false);

  const gamesQ = useQuery({
    queryKey: ["games"],
    queryFn: listGames,
    staleTime: 60_000,
  });

  // Reset all fields whenever the drawer opens.
  React.useEffect(() => {
    if (!open) return;
    setTitle("");
    setDescription("");
    setGameId("");
    setPillar("esports");
    setMaturity("teen");
    setIsPremium(false);
    setMp4Url("");
    setVideoDurationSec(null);
    setDurationInput("");
    setThumbnailUrl("");
  }, [open]);

  async function handlePickVideo() {
    try {
      setUploadingVideo(true);
      const res = await pickAndUploadVideo();
      if (res) {
        setMp4Url(res.url);
        setVideoDurationSec(res.durationSec);
        setDurationInput(res.durationSec != null ? String(res.durationSec) : "");
      }
    } catch (err) {
      toast.error("Video upload failed", {
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
    Number.isFinite(durationNum) &&
    durationNum > 0;
  const disabled = submitting || uploadingVideo || !valid;

  function handleSubmit() {
    onSubmit({
      title: title.trim(),
      gameId,
      mp4Url,
      thumbnailUrl,
      durationSec: durationNum,
      description: description.trim() || undefined,
      pillar,
      maturityRating: maturity,
      isPremium,
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
                New VOD
              </Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <X size={20} color="#9FBDBD" />
              </Pressable>
            </View>

            <FormField label="Video">
              {mp4Url ? (
                <View className="mb-2 flex-row items-center gap-2 rounded-md bg-cyan-500/25 px-3 py-2.5">
                  <CheckCircle2 size={14} color="#46E3CE" />
                  <View className="min-w-0 flex-1">
                    <Text className="text-xs font-medium text-cyan-200">
                      Video uploaded
                      {videoDurationSec != null
                        ? ` · ${formatDuration(videoDurationSec)}`
                        : ""}
                    </Text>
                    <Text
                      className="text-[10px] text-muted-foreground"
                      numberOfLines={1}
                    >
                      {mp4Url}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      setMp4Url("");
                      setVideoDurationSec(null);
                    }}
                    hitSlop={8}
                  >
                    <X size={14} color="#F87171" />
                  </Pressable>
                </View>
              ) : null}
              <Pressable
                onPress={handlePickVideo}
                disabled={uploadingVideo}
                className={`flex-row items-center justify-center gap-2 rounded-md bg-card px-3 py-2.5 ${
                  uploadingVideo ? "opacity-60" : ""
                }`}
              >
                {uploadingVideo ? (
                  <ActivityIndicator size="small" color="#46E3CE" />
                ) : (
                  <Film size={14} color="#46E3CE" />
                )}
                <Text className="text-sm text-foreground">
                  {uploadingVideo
                    ? "Uploading video… large files take a while"
                    : mp4Url
                      ? "Replace video"
                      : "Upload video (MP4, MOV or WebM, max 512 MB)"}
                </Text>
              </Pressable>
            </FormField>

            <FormField label="Thumbnail">
              {thumbnailUrl ? (
                <View className="mb-2 flex-row items-center gap-3">
                  <View
                    className="overflow-hidden rounded-md border border-border bg-card"
                    style={{ height: 72, width: 128 }}
                  >
                    <ImageWithFallback
                      source={thumbnailUrl}
                      tintSeed={thumbnailUrl}
                    />
                  </View>
                  <Pressable
                    onPress={() => setThumbnailUrl("")}
                    hitSlop={8}
                    className="flex-row items-center gap-1"
                  >
                    <X size={14} color="#F87171" />
                    <Text className="text-xs font-medium text-red-400">
                      Remove
                    </Text>
                  </Pressable>
                </View>
              ) : null}
              <UploadImageButton
                label={thumbnailUrl ? "Replace thumbnail" : "Upload thumbnail"}
                pending={false}
                onUploaded={setThumbnailUrl}
              />
            </FormField>

            <FormField label="Title">
              <Input
                value={title}
                onChangeText={setTitle}
                placeholder="Grand Finals - Game 5"
                className="bg-card"
              />
            </FormField>

            <FormField label="Description (optional)">
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder="What happens in this video"
                multiline
                className="min-h-[64px] bg-card"
              />
            </FormField>

            <FormField label="Game">
              <Select value={gameId} onValueChange={setGameId}>
                <SelectTrigger className="bg-card">
                  <SelectValue
                    placeholder={
                      gamesQ.isLoading ? "Loading games…" : "Select game"
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
            </FormField>

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

            <FormField label="Duration (seconds)">
              <Input
                value={durationInput}
                onChangeText={setDurationInput}
                keyboardType="number-pad"
                placeholder={
                  videoDurationSec != null
                    ? String(videoDurationSec)
                    : "Not reported by the picker - enter manually"
                }
                className="bg-card"
              />
              {videoDurationSec != null ? (
                <Text className="mt-1 text-[10px] text-muted-foreground">
                  Auto-filled from the uploaded video. Edit if needed.
                </Text>
              ) : null}
            </FormField>

            <View className="mb-1 flex-row items-center justify-between rounded-md border border-border bg-card/40 px-3 py-2.5">
              <View className="flex-1 pr-3">
                <Text className="text-sm font-medium text-foreground">
                  Premium
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Only premium subscribers can watch.
                </Text>
              </View>
              <Switch checked={isPremium} onCheckedChange={setIsPremium} />
            </View>

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
                  {submitting ? "Creating…" : "Create VOD"}
                </Text>
              </Button>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * Dashed upload affordance: picks an image from the device library, uploads
 * via /api/admin/uploads, hands the public blob URL to the caller. Spinner
 * covers both the upload and any follow-up mutation (`pending`).
 */
function UploadImageButton({
  label,
  pending,
  onUploaded,
}: {
  label: string;
  pending: boolean;
  onUploaded: (url: string) => void;
}) {
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

  const busy = uploading || pending;
  return (
    <Pressable
      onPress={handlePick}
      disabled={busy}
      className={`mb-3 flex-row items-center justify-center gap-2 rounded-md bg-card px-3 py-2.5 ${
        busy ? "opacity-60" : ""
      }`}
    >
      {busy ? (
        <ActivityIndicator size="small" color="#46E3CE" />
      ) : (
        <Upload size={14} color="#46E3CE" />
      )}
      <Text className="text-sm text-foreground">
        {busy ? "Uploading…" : label}
      </Text>
    </Pressable>
  );
}

function FormField({
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

function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
