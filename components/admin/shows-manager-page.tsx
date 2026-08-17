import * as React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  ChevronRight,
  Film,
  Plus,
  Tv,
  Upload,
  X,
} from "lucide-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";

import {
  adminCreateEpisode,
  adminCreateSeason,
  adminCreateShow,
  adminDeleteEpisode,
  adminGetShow,
  adminListShows,
  adminUpdateEpisode,
  adminUpdateShow,
  type AdminEpisode,
  type AdminSeason,
  type AdminShow,
  type ShowPillar,
} from "@/lib/api/shows-admin";
import {
  pickAndUploadImage,
  pickAndUploadVideo,
  uploadErrorMessage,
} from "@/lib/api/uploads";
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
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";

/**
 * The Shows CMS on a phone.
 *
 * Uploading is often easier here than at a desk: the footage is already on the
 * device that shot it, and the alternative is moving it to a laptop first.
 *
 * Three levels, one screen: the list of shows, then a show with its seasons,
 * then an episode. Deliberately not the whole web form. A phone is where a
 * show gets created and where episodes get added with the video attached;
 * fine-grained work like the price ladder and the social links stays on the
 * web, and this says so rather than offering a cramped version of it.
 */

const PILLARS: ShowPillar[] = ["esports", "anime", "lifestyle"];

function formatRuntime(sec: number): string {
  if (!sec) return "no runtime";
  const m = Math.round(sec / 60);
  return `${m} min`;
}

export function ShowsManagerPage() {
  const queryClient = useQueryClient();
  const [openShow, setOpenShow] = React.useState<AdminShow | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);

  const showsQ = useQuery({
    queryKey: ["admin-shows"],
    queryFn: () => adminListShows({ limit: 200 }),
  });

  const shows = showsQ.data?.shows ?? [];

  const refresh = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-shows"] });
  }, [queryClient]);

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="p-4 pb-24">
        <PageHeader
          title="Shows"
          description="Series and their episodes. Anything published here is on the site and in the app straight away."
          actions={
            <Button size="sm" onPress={() => setCreateOpen(true)}>
              <Plus size={16} color="#05191b" />
              <Text className="ml-1 font-semibold text-ink">New show</Text>
            </Button>
          }
        />

        {showsQ.isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator />
          </View>
        ) : shows.length === 0 ? (
          <View className="items-center rounded-xl border border-border bg-card/40 px-6 py-12">
            <Tv size={28} color="#7c8f8d" />
            <Text className="mt-3 text-center text-sm text-muted-foreground">
              No shows yet. Create one and it appears on the site.
            </Text>
          </View>
        ) : (
          <View className="gap-2">
            {shows.map((show) => (
              <Pressable
                key={show.id}
                onPress={() => setOpenShow(show)}
                className="flex-row items-center gap-3 rounded-xl border border-border bg-card/40 p-3 active:opacity-70"
              >
                <ImageWithFallback
                  source={show.posterUrl}
                  className="h-16 w-11 rounded-md"
                />
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                    {show.title}
                  </Text>
                  <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                    {show.totalSeasons}S · {show.totalEpisodes}E · {show.pillar}
                  </Text>
                  <View className="mt-1 flex-row gap-1.5">
                    <StatusBadge tone={show.status === "airing" ? "emerald" : "neutral"}>
                      {show.status}
                    </StatusBadge>
                    <StatusBadge tone={show.isPremium ? "amber" : "neutral"}>
                      {show.isPremium ? "Paid" : "Free"}
                    </StatusBadge>
                  </View>
                </View>
                <ChevronRight size={18} color="#7c8f8d" />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <ShowEditor
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={refresh}
      />

      <ShowDetail
        show={openShow}
        onClose={() => setOpenShow(null)}
        onChanged={refresh}
      />
    </View>
  );
}

/* ── Creating and editing a show ────────────────────────────────────────── */

function ShowEditor({
  open,
  show,
  onClose,
  onSaved,
}: {
  open: boolean;
  show?: AdminShow | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [title, setTitle] = React.useState("");
  const [synopsis, setSynopsis] = React.useState("");
  const [pillar, setPillar] = React.useState<ShowPillar>("esports");
  const [posterUrl, setPosterUrl] = React.useState("");
  const [isPremium, setIsPremium] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  // Reset when it opens, so a cancelled edit does not leak into the next one.
  React.useEffect(() => {
    if (!open) return;
    setTitle(show?.title ?? "");
    setSynopsis(show?.synopsis ?? "");
    setPillar(show?.pillar ?? "esports");
    setPosterUrl(show?.posterUrl ?? "");
    setIsPremium(show?.isPremium ?? false);
  }, [open, show]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        title: title.trim(),
        synopsis: synopsis.trim(),
        pillar,
        posterUrl: posterUrl.trim(),
        isPremium,
      };
      return show
        ? adminUpdateShow(show.id, payload)
        : adminCreateShow(payload);
    },
    onSuccess: async () => {
      toast.success(show ? "Show saved" : "Show created");
      onClose();
      await onSaved();
    },
    onError: (err: unknown) =>
      toast.error("Could not save the show", {
        description: err instanceof Error ? err.message : undefined,
      }),
  });

  async function handlePickPoster() {
    try {
      setUploading(true);
      const url = await pickAndUploadImage();
      if (url) setPosterUrl(url);
    } catch (err) {
      toast.error("Poster upload failed", { description: uploadErrorMessage(err) });
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <Text className="text-base font-semibold text-foreground">
            {show ? "Edit show" : "New show"}
          </Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <X size={20} color="#7c8f8d" />
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="gap-4 p-4 pb-24">
          <View className="gap-2">
            <Label>Title</Label>
            <Input value={title} onChangeText={setTitle} placeholder="Otaku and Chillz" />
            {/* The URL follows the title. Said out loud so nobody goes looking
                for a slug field that deliberately does not exist. */}
            <Text className="text-xs text-muted-foreground">
              The web address comes from the title.
            </Text>
          </View>

          <View className="gap-2">
            <Label>Description</Label>
            <Input
              value={synopsis}
              onChangeText={setSynopsis}
              placeholder="What the show is, in the words a viewer reads."
              multiline
              numberOfLines={4}
              className="h-24"
            />
          </View>

          <View className="gap-2">
            <Label>Pillar</Label>
            <Select value={pillar} onValueChange={(v) => setPillar(v as ShowPillar)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PILLARS.map((p) => (
                  <SelectItem key={p} value={p}>
                    <Text className="capitalize text-foreground">{p}</Text>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </View>

          <View className="gap-2">
            <Label>Poster</Label>
            <View className="flex-row items-center gap-3">
              <ImageWithFallback source={posterUrl} className="h-24 w-16 rounded-md" />
              <Button
                variant="outline"
                onPress={handlePickPoster}
                disabled={uploading}
                className="flex-1"
              >
                {uploading ? <ActivityIndicator /> : <Upload size={16} color="#7ee7d8" />}
                <Text className="ml-2 text-foreground">
                  {uploading ? "Uploading" : posterUrl ? "Replace poster" : "Pick a poster"}
                </Text>
              </Button>
            </View>
            <Text className="text-xs text-muted-foreground">
              Portrait artwork. The web CMS checks the exact shape and size.
            </Text>
          </View>

          <View className="flex-row items-center justify-between rounded-lg border border-border p-3">
            <View className="flex-1 pr-3">
              <Label>Paid show</Label>
              <Text className="text-xs text-muted-foreground">
                New episodes inherit this. Prices over time are set on the web.
              </Text>
            </View>
            <Switch checked={isPremium} onCheckedChange={setIsPremium} />
          </View>

          <Button
            onPress={() => save.mutate()}
            disabled={title.trim().length < 2 || save.isPending}
          >
            {save.isPending ? <ActivityIndicator color="#05191b" /> : null}
            <Text className="font-semibold text-ink">
              {show ? "Save show" : "Create show"}
            </Text>
          </Button>
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ── A show, its seasons and its episodes ───────────────────────────────── */

function ShowDetail({
  show,
  onClose,
  onChanged,
}: {
  show: AdminShow | null;
  onClose: () => void;
  onChanged: () => Promise<void> | void;
}) {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = React.useState(false);
  const [episodeFor, setEpisodeFor] = React.useState<{
    season: AdminSeason;
    episode: AdminEpisode | null;
  } | null>(null);

  const detailQ = useQuery({
    queryKey: ["admin-show", show?.id],
    queryFn: () => adminGetShow(show!.id),
    enabled: Boolean(show),
  });

  const seasons = detailQ.data?.seasons ?? [];
  const episodes = detailQ.data?.episodes ?? [];

  const refresh = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-show", show?.id] });
    await onChanged();
  }, [queryClient, show?.id, onChanged]);

  const addSeason = useMutation({
    mutationFn: () => adminCreateSeason(show!.id, {}),
    onSuccess: async (res) => {
      toast.success(`Season ${res.season.seasonNumber} added`);
      await refresh();
    },
    onError: (err: unknown) =>
      toast.error("Could not add the season", {
        description: err instanceof Error ? err.message : undefined,
      }),
  });

  const pullEpisode = useMutation({
    mutationFn: (episode: AdminEpisode) => adminDeleteEpisode(episode.id),
    onSuccess: async () => {
      toast.success("Episode pulled");
      await refresh();
    },
    onError: (err: unknown) =>
      toast.error("Could not pull the episode", {
        description: err instanceof Error ? err.message : undefined,
      }),
  });

  if (!show) return null;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <View className="min-w-0 flex-1 pr-3">
            <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
              {show.title}
            </Text>
            <Text className="text-xs text-muted-foreground">/show/{show.slug}</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12}>
            <X size={20} color="#7c8f8d" />
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="gap-4 p-4 pb-24">
          <View className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onPress={() => setEditOpen(true)}>
              <Text className="text-foreground">Edit show</Text>
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onPress={() => addSeason.mutate()}
              disabled={addSeason.isPending}
            >
              <Plus size={16} color="#7ee7d8" />
              <Text className="ml-1 text-foreground">Add season</Text>
            </Button>
          </View>

          {detailQ.isLoading ? (
            <View className="items-center py-10">
              <ActivityIndicator />
            </View>
          ) : seasons.length === 0 ? (
            <Text className="rounded-lg bg-card/50 p-6 text-center text-sm text-muted-foreground">
              No seasons yet. Add one, then episodes go inside it.
            </Text>
          ) : (
            seasons.map((season) => {
              const inSeason = episodes.filter((e) => e.seasonId === season.id);
              return (
                <View key={season.id} className="rounded-xl border border-border">
                  <View className="flex-row items-center justify-between border-b border-border px-3 py-2.5">
                    <View>
                      <Text className="text-sm font-medium text-foreground">
                        Season {season.seasonNumber}
                        {season.title ? `: ${season.title}` : ""}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        {inSeason.length} episode{inSeason.length === 1 ? "" : "s"}
                      </Text>
                    </View>
                    <Button
                      size="sm"
                      variant="secondary"
                      onPress={() => setEpisodeFor({ season, episode: null })}
                    >
                      <Plus size={14} color="#7ee7d8" />
                      <Text className="ml-1 text-xs text-foreground">Episode</Text>
                    </Button>
                  </View>

                  {inSeason.length === 0 ? (
                    <Text className="px-3 py-4 text-sm text-muted-foreground">
                      Nothing in this season yet.
                    </Text>
                  ) : (
                    inSeason.map((episode) => (
                      <Pressable
                        key={episode.id}
                        onPress={() => setEpisodeFor({ season, episode })}
                        onLongPress={() => pullEpisode.mutate(episode)}
                        className="flex-row items-center gap-3 border-b border-border px-3 py-2.5 active:opacity-70"
                      >
                        <Text className="w-8 text-xs text-muted-foreground">
                          E{episode.episodeNumber}
                        </Text>
                        <View className="min-w-0 flex-1">
                          <Text className="text-sm text-foreground" numberOfLines={1}>
                            {episode.title}
                          </Text>
                          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                            {formatRuntime(episode.runtimeSec)}
                            {episode.hlsUrl ? "" : " · no video"}
                          </Text>
                        </View>
                        <StatusBadge tone={episode.isPremium ? "amber" : "neutral"}>
                          {episode.isPremium ? "Paid" : "Free"}
                        </StatusBadge>
                      </Pressable>
                    ))
                  )}
                </View>
              );
            })
          )}

          <Text className="text-center text-xs text-muted-foreground">
            Long-press an episode to pull it. Social links and the price ladder
            are on the web CMS.
          </Text>
        </ScrollView>
      </View>

      <ShowEditor
        open={editOpen}
        show={show}
        onClose={() => setEditOpen(false)}
        onSaved={refresh}
      />

      <EpisodeEditor
        showId={show.id}
        target={episodeFor}
        onClose={() => setEpisodeFor(null)}
        onSaved={refresh}
      />
    </Modal>
  );
}

/* ── One episode, with the video attached from the device ───────────────── */

function EpisodeEditor({
  showId,
  target,
  onClose,
  onSaved,
}: {
  showId: string;
  target: { season: AdminSeason; episode: AdminEpisode | null } | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [title, setTitle] = React.useState("");
  const [synopsis, setSynopsis] = React.useState("");
  const [hlsUrl, setHlsUrl] = React.useState("");
  const [thumbnailUrl, setThumbnailUrl] = React.useState("");
  const [runtimeMin, setRuntimeMin] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [uploadingThumb, setUploadingThumb] = React.useState(false);

  const episode = target?.episode ?? null;

  React.useEffect(() => {
    if (!target) return;
    setTitle(episode?.title ?? "");
    setSynopsis(episode?.synopsis ?? "");
    setHlsUrl(episode?.hlsUrl ?? "");
    setThumbnailUrl(episode?.thumbnailUrl ?? "");
    setRuntimeMin(
      episode?.runtimeSec ? String(Math.round(episode.runtimeSec / 60)) : "",
    );
  }, [target, episode]);

  const save = useMutation({
    mutationFn: async () => {
      const runtimeSec = Math.round(Number(runtimeMin || 0) * 60);
      const payload = {
        title: title.trim(),
        synopsis: synopsis.trim(),
        hlsUrl: hlsUrl.trim(),
        thumbnailUrl: thumbnailUrl.trim(),
        runtimeSec: Number.isFinite(runtimeSec) ? runtimeSec : 0,
      };
      if (episode) return adminUpdateEpisode(episode.id, payload);
      return adminCreateEpisode(showId, {
        ...payload,
        seasonId: target!.season.id,
      });
    },
    onSuccess: async (res) => {
      toast.success(`Episode ${res.episode.episodeNumber} saved`);
      onClose();
      await onSaved();
    },
    onError: (err: unknown) =>
      toast.error("Could not save the episode", {
        description: err instanceof Error ? err.message : undefined,
      }),
  });

  async function handlePickVideo() {
    try {
      setUploading(true);
      const res = await pickAndUploadVideo();
      if (res) {
        setHlsUrl(res.url);
        // The picker knows how long the file is, so the runtime does not have
        // to be typed and then be wrong.
        if (res.durationSec != null) {
          setRuntimeMin(String(Math.max(1, Math.round(res.durationSec / 60))));
        }
      }
    } catch (err) {
      toast.error("Video upload failed", { description: uploadErrorMessage(err) });
    } finally {
      setUploading(false);
    }
  }

  async function handlePickThumb() {
    try {
      setUploadingThumb(true);
      const url = await pickAndUploadImage();
      if (url) setThumbnailUrl(url);
    } catch (err) {
      toast.error("Thumbnail upload failed", { description: uploadErrorMessage(err) });
    } finally {
      setUploadingThumb(false);
    }
  }

  return (
    <Modal visible={target !== null} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <Text className="text-base font-semibold text-foreground">
            {episode ? `Episode ${episode.episodeNumber}` : "New episode"}
          </Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <X size={20} color="#7c8f8d" />
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="gap-4 p-4 pb-24">
          <View className="gap-2">
            <Label>Title</Label>
            <Input value={title} onChangeText={setTitle} placeholder="Episode title" />
          </View>

          <View className="gap-2">
            <Label>Synopsis</Label>
            <Input
              value={synopsis}
              onChangeText={setSynopsis}
              multiline
              numberOfLines={3}
              className="h-20"
            />
          </View>

          <View className="gap-2">
            <Label>Video</Label>
            <Button variant="outline" onPress={handlePickVideo} disabled={uploading}>
              {uploading ? <ActivityIndicator /> : <Film size={16} color="#7ee7d8" />}
              <Text className="ml-2 text-foreground">
                {uploading
                  ? "Uploading, keep this open"
                  : hlsUrl
                    ? "Replace the video"
                    : "Pick a video from this phone"}
              </Text>
            </Button>
            {hlsUrl ? (
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {hlsUrl}
              </Text>
            ) : null}
          </View>

          <View className="gap-2">
            <Label>Thumbnail</Label>
            <View className="flex-row items-center gap-3">
              <ImageWithFallback source={thumbnailUrl} className="h-14 w-24 rounded-md" />
              <Button
                variant="outline"
                onPress={handlePickThumb}
                disabled={uploadingThumb}
                className="flex-1"
              >
                {uploadingThumb ? (
                  <ActivityIndicator />
                ) : (
                  <Upload size={16} color="#7ee7d8" />
                )}
                <Text className="ml-2 text-foreground">
                  {uploadingThumb ? "Uploading" : "Pick"}
                </Text>
              </Button>
            </View>
          </View>

          <View className="gap-2">
            <Label>Runtime, minutes</Label>
            <Input
              value={runtimeMin}
              onChangeText={setRuntimeMin}
              keyboardType="number-pad"
              placeholder="24"
            />
          </View>

          <Button
            onPress={() => save.mutate()}
            disabled={title.trim().length < 1 || save.isPending || uploading}
          >
            {save.isPending ? <ActivityIndicator color="#05191b" /> : null}
            <Text className="font-semibold text-ink">
              {episode ? "Save episode" : "Add episode"}
            </Text>
          </Button>
        </ScrollView>
      </View>
    </Modal>
  );
}
