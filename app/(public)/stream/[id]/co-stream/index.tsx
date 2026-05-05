import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";
import {
  ArrowLeft,
  Check,
  Clock,
  Languages,
  Radio,
  Sparkles,
  Users,
} from "lucide-react-native";

import { getStreamById } from "@/lib/mock/streams";
import {
  listCoStreamTracks,
  type CoStreamTrack,
} from "@/lib/mock/co-streams";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { HLSPlayer } from "@/components/stream/hls-player";

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function NowPlayingBanner({ track }: { track: CoStreamTrack }) {
  return (
    <View className="rounded-xl border border-border bg-card px-4 py-3">
      <View className="flex-row items-center gap-3">
        <Avatar className="h-11 w-11">
          <AvatarImage src={track.avatarUrl} />
          <AvatarFallback>
            {track.displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Sparkles size={12} color="#2CD7E3" />
            <Text
              className="text-xs font-semibold uppercase"
              style={{ color: "#2CD7E3", letterSpacing: 0.5 }}
            >
              Now playing
            </Text>
          </View>
          <Text
            className="text-sm font-semibold text-foreground"
            numberOfLines={1}
          >
            {track.displayName}
          </Text>
          <Text
            className="text-xs text-muted-foreground"
            numberOfLines={1}
          >
            {track.tagline}
          </Text>
        </View>
      </View>
      <View className="mt-3 flex-row items-center gap-3">
        <View className="flex-row items-center gap-1">
          <Languages size={12} color="#a3a3a3" />
          <Text className="text-xs text-muted-foreground uppercase">
            {track.language}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Users size={12} color="#a3a3a3" />
          <Text className="text-xs text-muted-foreground">
            {compact(track.viewerCount)}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Clock size={12} color="#a3a3a3" />
          <Text className="text-xs text-muted-foreground">
            {track.delaySeconds === 0
              ? "live"
              : `+${track.delaySeconds}s`}
          </Text>
        </View>
        <Text className="text-xs text-muted-foreground">
          {track.bitrateKbps} kbps
        </Text>
      </View>
    </View>
  );
}

interface TrackCardProps {
  track: CoStreamTrack;
  selected: boolean;
  onSelect: () => void;
}

function TrackCard({ track, selected, onSelect }: TrackCardProps) {
  return (
    <Pressable
      onPress={onSelect}
      className={`flex-row items-center gap-3 rounded-xl border p-3 active:opacity-80 ${
        selected
          ? "border-brand bg-brand/10"
          : "border-border bg-card"
      }`}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={track.avatarUrl} />
        <AvatarFallback>
          {track.displayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <Text
            className="text-sm font-semibold text-foreground"
            numberOfLines={1}
          >
            {track.displayName}
          </Text>
          {track.isOfficial ? (
            <Badge className="bg-brand" textClassName="text-black">
              Official
            </Badge>
          ) : null}
        </View>
        <Text
          className="text-xs text-muted-foreground"
          numberOfLines={1}
        >
          {track.tagline}
        </Text>
        <View className="flex-row items-center gap-2 mt-0.5">
          <Text
            className="text-xs uppercase"
            style={{ color: "#a3a3a3", letterSpacing: 0.4 }}
          >
            {track.language}
          </Text>
          <Text style={{ color: "#525252" }}>·</Text>
          <Text className="text-xs text-muted-foreground">
            {compact(track.viewerCount)} listening
          </Text>
        </View>
      </View>
      {selected ? (
        <View
          className="h-7 w-7 items-center justify-center rounded-full"
          style={{ backgroundColor: "#2CD7E3" }}
        >
          <Check size={16} color="#000" />
        </View>
      ) : null}
    </Pressable>
  );
}

export default function CoStreamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const streamId = id ?? "";

  const { data: stream, isLoading: streamLoading } = useQuery({
    queryKey: ["stream", streamId],
    queryFn: () => getStreamById(streamId),
    enabled: streamId.length > 0,
  });

  const { data: tracks, isLoading: tracksLoading } = useQuery({
    queryKey: ["co-streams", streamId],
    queryFn: () => listCoStreamTracks(streamId),
    enabled: streamId.length > 0,
  });

  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (tracks && tracks.length > 0 && !selectedId) {
      const official = tracks.find((t) => t.isOfficial) ?? tracks[0];
      if (official) setSelectedId(official.id);
    }
  }, [tracks, selectedId]);

  const selected = React.useMemo(
    () => (tracks ?? []).find((t) => t.id === selectedId) ?? null,
    [tracks, selectedId],
  );

  const handleSelect = (track: CoStreamTrack) => {
    setSelectedId(track.id);
    if (track.isOfficial) {
      toast("Switched to official tournament audio");
    } else {
      toast.success(`Switched to ${track.displayName}`);
    }
  };

  if (streamLoading) {
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

  if (!stream) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center bg-background px-6">
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyTitle>Stream not found</EmptyTitle>
              <EmptyDescription>
                The stream may have ended or the link is invalid.
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

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="relative bg-black">
          <HLSPlayer src={stream.hlsUrl} poster={stream.thumbnailUrl} />

          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Back"
            className="absolute left-3 top-12 h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            hitSlop={10}
          >
            <ArrowLeft size={20} color="#fff" />
          </Pressable>

          <View
            className="absolute left-3 top-12 ml-12 flex-row items-center gap-1.5 rounded px-2 py-1"
            style={{ backgroundColor: "rgba(220,38,38,0.9)" }}
            pointerEvents="none"
          >
            <View
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "#fff" }}
            />
            <Text
              className="text-xs font-bold uppercase text-white"
              style={{ letterSpacing: 0.5 }}
            >
              Live
            </Text>
          </View>
          <View
            className="absolute right-3 top-12 rounded px-2 py-1"
            style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
            pointerEvents="none"
          >
            <Text className="text-xs font-medium text-white">
              {compact(stream.viewerCount)} watching
            </Text>
          </View>

          {selected ? (
            <View
              className="absolute right-3 bottom-3 rounded-md px-2.5 py-1.5"
              style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
              pointerEvents="none"
            >
              <Text
                style={{
                  fontSize: 9,
                  letterSpacing: 0.5,
                  color: "#7dd3fc",
                  textTransform: "uppercase",
                }}
              >
                Audio mux
              </Text>
              <Text className="text-xs font-semibold text-white">
                {selected.displayName}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="px-4 pt-4 gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-foreground">
              Co-stream mode
            </Text>
            <Button
              size="sm"
              variant="outline"
              onPress={() => router.replace(`/stream/${streamId}`)}
            >
              Standard view
            </Button>
          </View>

          {selected ? <NowPlayingBanner track={selected} /> : null}

          <View className="gap-2">
            <Text
              className="text-xl font-bold text-foreground"
              numberOfLines={3}
            >
              {stream.title}
            </Text>
            <Text
              className="text-sm text-muted-foreground"
              numberOfLines={3}
            >
              {stream.description}
            </Text>
            <View className="flex-row flex-wrap gap-1.5 mt-1">
              <Badge variant="secondary">Co-stream mode</Badge>
              <Badge variant="outline">
                {stream.language.toUpperCase()}
              </Badge>
              {stream.tags.slice(0, 4).map((t) => (
                <Badge key={t} variant="outline">
                  {t}
                </Badge>
              ))}
            </View>
          </View>

          <View className="rounded-xl border border-border bg-card p-3">
            <View className="flex-row items-start gap-2">
              <Sparkles size={14} color="#2CD7E3" />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">
                  How co-stream works
                </Text>
                <Text className="mt-1 text-xs text-muted-foreground leading-4">
                  The video feed stays the same — you swap audio between the
                  official tournament call and creator commentary in real time.
                  Try a few until you find your vibe.
                </Text>
              </View>
            </View>
          </View>

          {/* Tracks */}
          <View className="rounded-xl border border-border bg-card">
            <View className="border-b border-border px-4 py-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Radio size={14} color="#2CD7E3" />
                <Text className="text-sm font-semibold text-foreground">
                  Commentary tracks
                </Text>
              </View>
              <Text
                className="text-xs uppercase text-muted-foreground"
                style={{ letterSpacing: 0.5 }}
              >
                {(tracks?.length ?? 0).toString()} live
              </Text>
            </View>
            <View className="p-3 gap-2">
              {tracksLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    style={{ height: 68, borderRadius: 12 }}
                  />
                ))
              ) : !tracks || tracks.length === 0 ? (
                <Text className="py-6 text-center text-sm text-muted-foreground">
                  No co-streams available for this match.
                </Text>
              ) : (
                tracks.map((t) => (
                  <TrackCard
                    key={t.id}
                    track={t}
                    selected={selectedId === t.id}
                    onSelect={() => handleSelect(t)}
                  />
                ))
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
