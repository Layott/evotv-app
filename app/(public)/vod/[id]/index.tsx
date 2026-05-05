import * as React from "react";
import { Pressable, ScrollView, Share, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";
import {
  ArrowLeft,
  BookmarkPlus,
  Clock,
  Eye,
  Lock,
  Share2,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react-native";

import { getVodById, listRelatedVods } from "@/lib/mock/vods";
import type { Vod } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { HLSPlayer } from "@/components/stream/hls-player";
import { VodRelated } from "@/components/vod/vod-related";
import { VodComments } from "@/components/vod/vod-comments";
import { useMockAuth } from "@/components/providers";

function relTime(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
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

function formatClock(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface PaywallProps {
  vod: Vod;
  onUpgrade: () => void;
}

function PaywallOverlay({ vod, onUpgrade }: PaywallProps) {
  return (
    <View className="relative w-full" style={{ aspectRatio: 16 / 9 }}>
      <Image
        source={vod.thumbnailUrl}
        style={{ width: "100%", height: "100%", opacity: 0.4 }}
        contentFit="cover"
      />
      <View
        className="absolute inset-0 items-center justify-center px-6 gap-3"
        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      >
        <View
          className="flex-row items-center gap-1 rounded-md px-2 py-0.5"
          style={{ backgroundColor: "#f59e0b" }}
        >
          <Lock size={11} color="#000" />
          <Text style={{ fontSize: 11, fontWeight: "700", color: "#000" }}>
            Premium VOD
          </Text>
        </View>
        <Text className="text-center text-xl font-bold text-white">
          {vod.title}
        </Text>
        <Text className="text-center text-sm text-neutral-300">
          Unlock archives and deep-dive VODs with EVO Premium.
        </Text>
        <Button
          onPress={onUpgrade}
          className="bg-amber-500"
          textClassName="text-black font-semibold"
        >
          <Sparkles size={16} color="#000" />
          Upgrade with Paystack
        </Button>
      </View>
    </View>
  );
}

interface ChaptersProps {
  vod: Vod;
}

function VodChapters({ vod }: ChaptersProps) {
  if (!vod.chapters || vod.chapters.length === 0) return null;
  return (
    <View className="rounded-xl border border-border bg-card p-3">
      <View className="flex-row items-center gap-2 mb-2">
        <Clock size={14} color="#a3a3a3" />
        <Text className="text-sm font-semibold text-foreground">Chapters</Text>
      </View>
      <View className="gap-1.5">
        {vod.chapters.map((c, i) => (
          <Pressable
            key={`${c.label}-${i}`}
            onPress={() =>
              toast(`Jump to ${c.label} at ${formatClock(c.startSec)}`)
            }
            className="flex-row items-center justify-between rounded px-2 py-1.5 active:bg-accent"
          >
            <Text
              className="text-sm text-foreground flex-1"
              numberOfLines={1}
            >
              {c.label}
            </Text>
            <Text
              className="text-xs text-muted-foreground"
              style={{ fontFamily: "monospace" }}
            >
              {formatClock(c.startSec)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function VodScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { role } = useMockAuth();
  const vodId = id ?? "";

  const { data: vod, isLoading } = useQuery({
    queryKey: ["vod", vodId],
    queryFn: () => getVodById(vodId),
    enabled: vodId.length > 0,
  });
  const { data: related } = useQuery({
    queryKey: ["vod-related", vodId],
    queryFn: () => listRelatedVods(vodId, 6),
    enabled: vodId.length > 0,
  });

  const [liked, setLiked] = React.useState(false);
  const [disliked, setDisliked] = React.useState(false);
  const [likes, setLikes] = React.useState(0);
  const [dislikes, setDislikes] = React.useState(0);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    if (vod) setLikes(vod.likeCount);
  }, [vod]);

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-background">
          <Skeleton style={{ width: "100%", aspectRatio: 16 / 9 }} />
          <View className="px-4 py-4 gap-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </View>
        </View>
      </>
    );
  }

  if (!vod) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center bg-background px-6">
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyTitle>VOD not found</EmptyTitle>
              <EmptyDescription>
                This video may have been removed.
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

  const paywalled = vod.isPremium && role !== "premium" && role !== "admin";

  const onLike = () => {
    if (liked) {
      setLiked(false);
      setLikes((v) => Math.max(0, v - 1));
    } else {
      setLiked(true);
      setLikes((v) => v + 1);
      if (disliked) {
        setDisliked(false);
        setDislikes((v) => Math.max(0, v - 1));
      }
      toast.success("Liked");
    }
  };
  const onDislike = () => {
    if (disliked) {
      setDisliked(false);
      setDislikes((v) => Math.max(0, v - 1));
    } else {
      setDisliked(true);
      setDislikes((v) => v + 1);
      if (liked) {
        setLiked(false);
        setLikes((v) => Math.max(0, v - 1));
      }
      toast("Feedback recorded");
    }
  };
  const onShare = async () => {
    try {
      await Share.share({ message: `Watch on EVO TV: ${vod.title}` });
    } catch {
      toast.error("Share failed");
    }
  };
  const onSave = () => {
    setSaved((v) => {
      toast.success(v ? "Removed from library" : "Saved to library");
      return !v;
    });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="relative bg-black">
          {paywalled ? (
            <PaywallOverlay
              vod={vod}
              onUpgrade={() => router.push("/upgrade")}
            />
          ) : (
            <HLSPlayer src={vod.hlsUrl} poster={vod.thumbnailUrl} />
          )}
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Back"
            className="absolute left-3 top-12 h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            hitSlop={10}
          >
            <ArrowLeft size={20} color="#fff" />
          </Pressable>
        </View>

        <View className="px-4 pt-4 gap-4">
          <View>
            <Text
              className="text-xl font-bold text-foreground leading-tight"
              numberOfLines={3}
            >
              {vod.title}
            </Text>
            <View className="mt-2 flex-row flex-wrap items-center gap-2">
              <View className="flex-row items-center gap-1">
                <Eye size={13} color="#a3a3a3" />
                <Text className="text-xs text-muted-foreground">
                  {compact(vod.viewCount)} views
                </Text>
              </View>
              <Text className="text-xs text-muted-foreground">·</Text>
              <Text className="text-xs text-muted-foreground">
                {relTime(vod.publishedAt)}
              </Text>
              {vod.isPremium ? (
                <Badge className="bg-amber-500" textClassName="text-black">
                  Premium
                </Badge>
              ) : null}
            </View>
          </View>

          {/* Actions */}
          <View className="flex-row flex-wrap gap-2">
            <View
              className="flex-row items-center rounded-full border border-border bg-card overflow-hidden"
            >
              <Pressable
                onPress={onLike}
                className="flex-row items-center gap-1.5 px-3 py-1.5 active:opacity-70"
              >
                <ThumbsUp
                  size={14}
                  color={liked ? "#2CD7E3" : "#FAFAFA"}
                  fill={liked ? "#2CD7E3" : "transparent"}
                />
                <Text className="text-sm text-foreground">
                  {compact(likes)}
                </Text>
              </Pressable>
              <View className="h-5 w-px bg-border" />
              <Pressable
                onPress={onDislike}
                className="flex-row items-center gap-1.5 px-3 py-1.5 active:opacity-70"
              >
                <ThumbsDown
                  size={14}
                  color={disliked ? "#f87171" : "#FAFAFA"}
                  fill={disliked ? "#f87171" : "transparent"}
                />
                {dislikes > 0 ? (
                  <Text className="text-sm text-foreground">
                    {compact(dislikes)}
                  </Text>
                ) : null}
              </Pressable>
            </View>
            <Button variant="outline" size="sm" onPress={onShare}>
              <Share2 size={14} color="#FAFAFA" />
              Share
            </Button>
            <Button
              variant={saved ? "default" : "outline"}
              size="sm"
              onPress={onSave}
              className={saved ? "bg-brand" : ""}
              textClassName={saved ? "text-black font-semibold" : ""}
            >
              <BookmarkPlus
                size={14}
                color={saved ? "#000" : "#FAFAFA"}
              />
              {saved ? "Saved" : "Save"}
            </Button>
          </View>

          {vod.description ? (
            <View className="rounded-lg border border-border bg-card p-3">
              <Text className="text-sm text-foreground leading-5">
                {vod.description}
              </Text>
            </View>
          ) : null}

          <VodChapters vod={vod} />

          {related && related.length > 0 ? <VodRelated vods={related} /> : null}

          <Separator />

          <VodComments vodId={vod.id} />
        </View>
      </ScrollView>
    </>
  );
}
