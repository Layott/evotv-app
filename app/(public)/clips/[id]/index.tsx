import * as React from "react";
import { Pressable, Share, Text, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";
import {
  ArrowLeft,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Heart,
  MessageCircle,
  Pause,
  Play,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react-native";

import { getClipById, listTrendingClips } from "@/lib/api/vods";
import type { Clip } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useMockAuth } from "@/components/providers";

function relTime(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function ClipPlayer({
  clip,
  muted,
  setMuted,
}: {
  clip: Clip;
  muted: boolean;
  setMuted: (b: boolean) => void;
}) {
  const [playing, setPlaying] = React.useState(true);
  const player = useVideoPlayer({ uri: clip.mp4Url }, (p) => {
    p.muted = muted;
    p.loop = true;
    p.play();
  });

  React.useEffect(() => {
    player.muted = muted;
  }, [player, muted]);

  React.useEffect(() => {
    const sub = player.addListener("statusChange", () => {
      setPlaying(player.playing);
    });
    return () => sub.remove();
  }, [player]);

  const togglePlay = () => {
    if (player.playing) {
      player.pause();
      setPlaying(false);
    } else {
      player.play();
      setPlaying(true);
    }
  };

  return (
    <View className="relative h-full w-full">
      <VideoView
        player={player}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
        nativeControls={false}
      />

      <Pressable
        onPress={togglePlay}
        className="absolute inset-0 items-center justify-center"
      >
        {!playing ? (
          <View
            className="items-center justify-center rounded-full"
            style={{
              width: 64,
              height: 64,
              backgroundColor: "rgba(0,0,0,0.55)",
            }}
          >
            <Play size={32} color="#fff" fill="#fff" />
          </View>
        ) : null}
      </Pressable>

      <View
        className="absolute right-3 top-3 flex-row gap-1.5"
        pointerEvents="box-none"
      >
        <Pressable
          onPress={() => setMuted(!muted)}
          accessibilityLabel={muted ? "Unmute" : "Mute"}
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
        >
          {muted ? (
            <VolumeX size={16} color="#fff" />
          ) : (
            <Volume2 size={16} color="#fff" />
          )}
        </Pressable>
        <Pressable
          onPress={togglePlay}
          accessibilityLabel={playing ? "Pause" : "Play"}
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
        >
          {playing ? (
            <Pause size={16} color="#fff" />
          ) : (
            <Play size={16} color="#fff" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}

function ActionButton({ icon, label, onPress }: ActionButtonProps) {
  return (
    <Pressable onPress={onPress} className="items-center gap-1">
      <View
        className="h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      >
        {icon}
      </View>
      <Text style={{ fontSize: 10, fontWeight: "500", color: "#fff" }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function ClipDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isFollowing, toggleFollow } = useMockAuth();
  const clipId = id ?? "";

  const { data: clip, isLoading } = useQuery({
    queryKey: ["clip", clipId],
    queryFn: () => getClipById(clipId),
    enabled: clipId.length > 0,
  });
  const { data: feed } = useQuery({
    queryKey: ["clips", "trending"],
    queryFn: () => listTrendingClips(24),
  });

  const [muted, setMuted] = React.useState(true);
  const [liked, setLiked] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState(0);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    if (clip) setLikeCount(clip.likeCount);
  }, [clip]);

  const idx = React.useMemo(
    () => (feed ?? []).findIndex((c) => c.id === clipId),
    [feed, clipId],
  );
  const prev = idx > 0 ? feed![idx - 1] : null;
  const next =
    idx >= 0 && feed && idx < feed.length - 1 ? feed[idx + 1] : null;

  const go = (dir: "prev" | "next") => {
    const target = dir === "prev" ? prev : next;
    if (target) router.replace(`/clips/${target.id}`);
  };

  const onLike = () => {
    setLiked((prev) => {
      setLikeCount((c) => (prev ? Math.max(0, c - 1) : c + 1));
      toast.success(prev ? "Like removed" : "Liked");
      return !prev;
    });
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `Check out this clip on EVO TV: ${clip?.title ?? ""}`,
      });
    } catch {
      toast.error("Share failed");
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center bg-black">
          <Skeleton
            style={{ aspectRatio: 9 / 16, width: "85%", borderRadius: 16 }}
          />
        </View>
      </>
    );
  }

  if (!clip) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center bg-background px-6">
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyTitle>Clip not found</EmptyTitle>
              <EmptyDescription>
                This clip may have been removed.
              </EmptyDescription>
            </EmptyHeader>
            <Button variant="outline" onPress={() => router.back()}>
              <ArrowLeft size={16} color="#FAFAFA" />
              <Text className="text-foreground text-sm font-medium">
                Go back
              </Text>
            </Button>
          </Empty>
        </View>
      </>
    );
  }

  const creatorTargetId = `streamer_${clip.creatorHandle}`;
  const followed = isFollowing("streamer", creatorTargetId);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center">
          <View
            style={{ aspectRatio: 9 / 16, width: "100%", maxHeight: "100%" }}
            className="relative overflow-hidden"
          >
            <ClipPlayer clip={clip} muted={muted} setMuted={setMuted} />

            {/* Back */}
            <Pressable
              onPress={() => router.back()}
              accessibilityLabel="Back"
              className="absolute left-3 top-12 h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
              hitSlop={10}
            >
              <ArrowLeft size={20} color="#fff" />
            </Pressable>

            {/* Prev / Next */}
            <View className="absolute right-3 top-1/2 gap-2" style={{ transform: [{ translateY: -40 }] }}>
              <Pressable
                onPress={() => go("prev")}
                disabled={!prev}
                className="h-9 w-9 items-center justify-center rounded-full"
                style={{
                  backgroundColor: "rgba(0,0,0,0.6)",
                  opacity: prev ? 1 : 0.4,
                }}
              >
                <ChevronUp size={18} color="#fff" />
              </Pressable>
              <Pressable
                onPress={() => go("next")}
                disabled={!next}
                className="h-9 w-9 items-center justify-center rounded-full"
                style={{
                  backgroundColor: "rgba(0,0,0,0.6)",
                  opacity: next ? 1 : 0.4,
                }}
              >
                <ChevronDown size={18} color="#fff" />
              </Pressable>
            </View>

            {/* Action rail */}
            <View className="absolute right-3 bottom-32 gap-3 items-center">
              <ActionButton
                icon={
                  <Heart
                    size={22}
                    color={liked ? "#f87171" : "#fff"}
                    fill={liked ? "#f87171" : "transparent"}
                  />
                }
                label={compact(likeCount)}
                onPress={onLike}
              />
              <ActionButton
                icon={<MessageCircle size={22} color="#fff" />}
                label="Comment"
                onPress={() => toast("Comments opened")}
              />
              <ActionButton
                icon={<Share2 size={22} color="#fff" />}
                label="Share"
                onPress={onShare}
              />
              <ActionButton
                icon={
                  <Bookmark
                    size={22}
                    color={saved ? "#fcd34d" : "#fff"}
                    fill={saved ? "#fcd34d" : "transparent"}
                  />
                }
                label={saved ? "Saved" : "Save"}
                onPress={() => {
                  setSaved((v) => !v);
                  toast.success(saved ? "Removed from saved" : "Saved");
                }}
              />
            </View>

            {/* Bottom creator overlay */}
            <View
              className="absolute inset-x-0 bottom-0 px-4 pb-6 pt-12"
              pointerEvents="box-none"
            >
              <View
                className="absolute inset-x-0 bottom-0 h-full"
                style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
                pointerEvents="none"
              />
              <View className="flex-row items-end gap-3">
                <View className="flex-1 gap-2">
                  <View className="flex-row items-center gap-2">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={clip.creatorAvatarUrl} />
                      <AvatarFallback>
                        {clip.creatorHandle.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <View className="flex-1">
                      <Text
                        className="text-sm font-semibold text-white"
                        numberOfLines={1}
                      >
                        @{clip.creatorHandle}
                      </Text>
                      <Text style={{ fontSize: 11, color: "#d4d4d4" }}>
                        {relTime(clip.createdAt)}
                      </Text>
                    </View>
                    <Button
                      size="sm"
                      variant={followed ? "outline" : "default"}
                      className={followed ? "" : "bg-brand"}
                      textClassName={followed ? "" : "text-black font-semibold"}
                      onPress={() => toggleFollow("streamer", creatorTargetId)}
                    >
                      {followed ? "Following" : "Follow"}
                    </Button>
                  </View>
                  <Text
                    className="text-sm text-white"
                    numberOfLines={3}
                  >
                    {clip.title}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </>
  );
}
