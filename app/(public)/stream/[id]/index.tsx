import * as React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Eye, MessageSquare, Info } from "lucide-react-native";
import { format } from "date-fns";

import { getStreamById } from "@/lib/api/streams";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HLSPlayer } from "@/components/stream/hls-player";
import { LiveChat } from "@/components/stream/live-chat";
import { ReportButton } from "@/components/common/report-button";
import { useMockAuth } from "@/components/providers";
import { useStreamHeartbeat } from "@/hooks/useStreamHeartbeat";
import type { Stream } from "@/lib/types";

function formatViewers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

/**
 * Threshold above which we switch to the desktop two-column layout
 * (player + chat sidebar). Below this we fall back to the stacked
 * mobile layout with chat in a tab. Native always stacks because the
 * device viewport is the only viewport.
 */
const WIDE_BREAKPOINT = 1024;

export default function StreamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const streamId = id ?? "";
  const { isFollowing, toggleFollow } = useMockAuth();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === "web" && width >= WIDE_BREAKPOINT;

  const { data: stream, isLoading, isError } = useQuery({
    queryKey: ["stream", streamId],
    queryFn: () => getStreamById(streamId),
    enabled: streamId.length > 0,
  });

  const channelHandle = React.useMemo(() => {
    if (!stream) return "";
    return stream.streamerName.toLowerCase().replace(/\s+/g, "");
  }, [stream]);

  const followed = stream ? isFollowing("streamer", stream.id) : false;

  useStreamHeartbeat(stream?.id, !!stream?.isLive);

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-background">
          <View className="aspect-video w-full">
            <Skeleton className="h-full w-full rounded-none" />
          </View>
          <View className="px-4 py-4 gap-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <View className="flex-row items-center gap-3 mt-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-1/2" />
            </View>
          </View>
        </View>
      </>
    );
  }

  if (isError || !stream) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-background items-center justify-center px-6">
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyTitle>Stream not found</EmptyTitle>
              <EmptyDescription>
                This stream may have ended or the link is invalid.
              </EmptyDescription>
            </EmptyHeader>
            <Button variant="outline" onPress={() => router.back()}>
              <ArrowLeft color="#FAFAFA" size={16} />
              <Text className="text-foreground text-sm font-medium">Go back</Text>
            </Button>
          </Empty>
        </View>
      </>
    );
  }

  const playerBlock = (
    <View className="relative bg-black">
      <HLSPlayer src={stream.hlsUrl} poster={stream.thumbnailUrl} />
      <Pressable
        onPress={() => router.back()}
        className="absolute left-3 top-12 h-9 w-9 rounded-full bg-black/60 items-center justify-center"
        hitSlop={10}
      >
        <ArrowLeft color="#FFFFFF" size={20} />
      </Pressable>
      {stream.isLive ? (
        <View className="absolute left-3 bottom-3 flex-row items-center gap-1.5 rounded bg-red-600/90 px-2 py-1">
          <View className="size-1.5 rounded-full bg-white" />
          <Text className="text-[11px] font-bold uppercase tracking-wider text-white">
            Live
          </Text>
        </View>
      ) : null}
    </View>
  );

  const headerBlock = (
    <View className="px-4 pt-4 pb-3 gap-2 border-b border-border">
      <Text className="text-base font-semibold text-foreground" numberOfLines={2}>
        {stream.title}
      </Text>
      <View className="flex-row items-center gap-3">
        <View className="flex-row items-center gap-1">
          <Eye color="#A3A3A3" size={14} />
          <Text className="text-xs text-muted-foreground">
            {formatViewers(stream.viewerCount)} watching
          </Text>
        </View>
        {stream.tags.slice(0, 2).map((tag) => (
          <Badge key={tag} variant="outline">
            {tag}
          </Badge>
        ))}
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3 flex-1 mr-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={stream.streamerAvatarUrl} />
            <AvatarFallback>
              {stream.streamerName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <View className="flex-1">
            <Text
              className="text-sm font-semibold text-foreground"
              numberOfLines={1}
            >
              {stream.streamerName}
            </Text>
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              @{channelHandle}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <ReportButton targetType="stream" targetId={stream.id} />
          <Button
            variant={followed ? "outline" : "default"}
            size="sm"
            onPress={() => toggleFollow("streamer", stream.id)}
            className={followed ? "" : "bg-brand"}
            textClassName={followed ? "" : "text-black font-semibold"}
          >
            {followed ? "Following" : "Follow"}
          </Button>
        </View>
      </View>
    </View>
  );

  if (isWide) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-background flex-row">
          <ScrollView className="flex-1" contentContainerClassName="pb-12">
            <View
              className="w-full mx-auto"
              style={{ maxWidth: 880 }}
            >
              {playerBlock}
              {headerBlock}
              <View className="px-4 pt-5">
                <AboutContent stream={stream} />
              </View>
            </View>
          </ScrollView>
          <View
            className="border-l border-border"
            style={{ width: 380 }}
          >
            <LiveChat streamId={stream.id} className="flex-1" />
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-background">
        {playerBlock}
        {headerBlock}

        <Tabs defaultValue="chat" className="flex-1">
          <View className="px-4 pt-3">
            <TabsList>
              <TabsTrigger value="chat">
                <MessageSquare color="#A3A3A3" size={14} />
                <Text className="text-sm font-medium text-foreground">Chat</Text>
              </TabsTrigger>
              <TabsTrigger value="about">
                <Info color="#A3A3A3" size={14} />
                <Text className="text-sm font-medium text-foreground">About</Text>
              </TabsTrigger>
            </TabsList>
          </View>

          <TabsContent value="chat" className="mt-3">
            <LiveChat streamId={stream.id} />
          </TabsContent>

          <TabsContent value="about" className="mt-3">
            <ScrollView className="flex-1" contentContainerClassName="px-4 pb-8 gap-4">
              <AboutContent stream={stream} />
            </ScrollView>
          </TabsContent>
        </Tabs>
      </View>
    </>
  );
}

function AboutContent({ stream }: { stream: Stream }) {
  return (
    <View className="gap-4">
      <View>
        <Text className="text-sm font-semibold text-foreground mb-1">
          Description
        </Text>
        <Text className="text-sm text-muted-foreground leading-5">
          {stream.description}
        </Text>
      </View>

      {stream.startedAt ? (
        <View>
          <Text className="text-sm font-semibold text-foreground mb-1">
            Started
          </Text>
          <Text className="text-sm text-muted-foreground">
            {format(new Date(stream.startedAt), "PPpp")}
          </Text>
        </View>
      ) : null}

      {stream.tags.length > 0 ? (
        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">
            Tags
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {stream.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </View>
        </View>
      ) : null}

      <View>
        <Text className="text-sm font-semibold text-foreground mb-1">
          Language
        </Text>
        <Text className="text-sm text-muted-foreground uppercase">
          {stream.language}
        </Text>
      </View>
    </View>
  );
}
