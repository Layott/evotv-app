import * as React from "react";
import { useTokens } from "@/lib/theme/tokens";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { ArrowLeft, Compass, Heart, Radio, ShieldCheck, Users } from "@/components/icons";

import {
  getChannelPage,
  toggleChannelFollow,
  type ChannelPageData,
} from "@/lib/api/channels";
import { useAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function ChannelPublicPage() {
  const palette = useTokens();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();

  const channelQ = useQuery({
    queryKey: ["channel", slug],
    queryFn: () => getChannelPage(slug!),
    enabled: !!slug,
    // liveStream.viewerCount on the channel page comes from the same
    // read-time count as /stream/[id]. Refresh on a 60s cadence so a
    // newly-live channel + viewer-count ticks reflect without a manual
    // reload. Falls back to false when liveStream is null.
    refetchInterval: (query) =>
      query.state.data?.liveStream ? 60_000 : false,
  });

  const followMut = useMutation({
    mutationFn: () => toggleChannelFollow(slug!),
    onSuccess: (res) => {
      qc.setQueryData<ChannelPageData>(["channel", slug], (prev) => {
        if (!prev) return prev;
        const delta = res.following ? 1 : -1;
        return {
          ...prev,
          followedByMe: res.following,
          channel: {
            ...prev.channel,
            followerCount: Math.max(0, prev.channel.followerCount + delta),
          },
        };
      });
      toast.success(res.following ? "Following" : "Unfollowed");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Action failed");
    },
  });

  const onFollow = () => {
    if (!isAuthenticated) {
      toast.error("Sign in to follow");
      return;
    }
    followMut.mutate();
  };

  if (channelQ.isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: "Channel" }} />
        <View className="flex-1 bg-background p-5">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="mt-5 h-7 w-1/2 rounded" />
          <Skeleton className="mt-3 h-44 rounded-2xl" />
        </View>
      </>
    );
  }
  if (channelQ.isError || !channelQ.data) {
    return (
      <>
        <Stack.Screen options={{ title: "Channel" }} />
        <View className="flex-1 items-center justify-center bg-background px-6">
          <Empty className="border-0">
            <EmptyHeader>
              <Radio size={28} color={palette.muted} />
              <EmptyTitle>Channel not found</EmptyTitle>
              <EmptyDescription>
                @{slug} doesn't exist or has been removed. The handle may have changed.
              </EmptyDescription>
            </EmptyHeader>
            <View className="flex-row items-center gap-2">
              <Button variant="outline" onPress={() => router.back()}>
                <ArrowLeft color={palette.fg} size={16} />
                <Text className="text-foreground text-sm font-medium">Go back</Text>
              </Button>
              <Button
                className="bg-brand"
                onPress={() => router.push("/discover" as never)}
                textClassName="text-black font-semibold"
              >
                <Compass color="#000" size={16} />
                Browse channels
              </Button>
            </View>
          </Empty>
        </View>
      </>
    );
  }

  const { channel, liveStream, recentVods, followedByMe } = channelQ.data;

  return (
    <>
      <Stack.Screen options={{ title: channel.name }} />
      <ScrollView className="flex-1 bg-background">
        <View
          style={{
            height: 120,
            backgroundColor: channel.brandColor || palette.brand,
            opacity: 0.5,
          }}
        />
        <View className="px-5 pb-6">
          <View className="-mt-9 flex-row items-end gap-3">
            <View
              className="h-20 w-20 items-center justify-center rounded-2xl border-4 border-background"
              style={{ backgroundColor: "#1f1f1f" }}
            >
              {channel.logoUrl ? (
                <Image
                  source={channel.logoUrl}
                  style={{ width: "100%", height: "100%", borderRadius: 12 }}
                  contentFit="cover"
                />
              ) : (
                <Radio size={28} color={palette.brand} />
              )}
            </View>
            <View className="flex-1 pb-1">
              <View className="flex-row items-center gap-2">
                <Text
                  className="text-xl font-bold text-foreground"
                  numberOfLines={1}
                >
                  {channel.name}
                </Text>
                {channel.isVerified ? (
                  <ShieldCheck size={16} color={palette.brand} />
                ) : null}
              </View>
              <Text className="text-xs text-muted-foreground">
                @{channel.slug} ·{" "}
                {channel.followerCount.toLocaleString()} followers
              </Text>
            </View>
          </View>

          <Button
            className={cn(
              "mt-4 h-10",
              followedByMe ? "bg-muted" : "bg-brand",
            )}
            disabled={followMut.isPending}
            onPress={onFollow}
            textClassName={followedByMe ? "text-foreground" : "text-black"}
          >
            <Heart
              size={14}
              color={followedByMe ? "#F472B6" : "#000"}
              weight={followedByMe ? "fill" : "regular"}
            />
            {followedByMe ? "Following" : "Follow"}
          </Button>

          {channel.description ? (
            <Text className="mt-4 text-sm text-neutral-300">
              {channel.description}
            </Text>
          ) : null}

          {liveStream ? (
            <Link
              href={`/stream/${liveStream.id}` as never}
              asChild
            >
              <Pressable className="mt-5 overflow-hidden rounded-2xl bg-brand/20 bg-card/60 active:opacity-80">
                <View
                  style={{
                    backgroundColor: "#1f1f1f",
                    aspectRatio: 16 / 9,
                  }}
                >
                  {liveStream.thumbnailUrl ? (
                    <Image
                      source={liveStream.thumbnailUrl}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  ) : null}
                  <View
                    className="absolute left-3 top-3 flex-row items-center gap-1 rounded-full px-2 py-0.5"
                    style={{ backgroundColor: "#dc2626" }}
                  >
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: "#fff",
                      }}
                    />
                    <Text className="text-[10px] font-bold text-white">LIVE</Text>
                  </View>
                </View>
                <View className="p-3">
                  <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                    {liveStream.title}
                  </Text>
                  <View className="mt-1 flex-row items-center gap-1">
                    <Users size={11} color={palette.muted} />
                    <Text className="text-[11px] text-muted-foreground">
                      {liveStream.viewerCount.toLocaleString()} watching
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Link>
          ) : (
            <View className="mt-5 rounded-2xl bg-card/60 p-6">
              <Text className="text-center text-sm text-muted-foreground">
                Not live right now.
              </Text>
            </View>
          )}

          <Text className="mt-6 text-sm font-semibold text-foreground">
            Recent VODs
          </Text>
          {recentVods.length === 0 ? (
            <Text className="mt-2 text-xs text-muted-foreground">
              No VODs yet.
            </Text>
          ) : (
            <View className="mt-3 flex-row flex-wrap gap-3">
              {recentVods.map((v) => (
                <Link
                  key={v.id}
                  href={`/vod/${v.id}` as never}
                  asChild
                >
                  <Pressable
                    className="overflow-hidden rounded-xl bg-card/60 active:opacity-80"
                    style={{ width: "47%" }}
                  >
                    <View
                      style={{ backgroundColor: "#1f1f1f", aspectRatio: 16 / 9 }}
                    >
                      {v.thumbnailUrl ? (
                        <Image
                          source={v.thumbnailUrl}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                      ) : null}
                    </View>
                    <View className="p-2">
                      <Text
                        className="text-xs font-semibold text-foreground"
                        numberOfLines={2}
                      >
                        {v.title}
                      </Text>
                      <Text className="mt-1 text-[10px] text-muted-foreground">
                        {v.viewCount.toLocaleString()} views
                      </Text>
                    </View>
                  </Pressable>
                </Link>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}
