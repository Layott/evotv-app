import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import {
  Stack,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";
import {
  BadgeCheck,
  Calendar,
  Eye,
  Flag,
  MapPin,
  Play,
  Tv2,
  UserPlus,
  UserCheck,
  Users,
} from "lucide-react-native";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getPublicProfileByHandle,
  type PublicProfileChannel,
  type PublicProfileClip,
  type PublicProfileVod,
} from "@/lib/api/profile";
import { useMockAuth } from "@/components/providers";
import { toggleFollow as apiToggleFollow } from "@/lib/api/follows";

const BRAND = "#2CD7E3";
const BRAND_RGBA = (a: number) => `rgba(44,215,227,${a})`;

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatJoined(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function HeaderSkeleton() {
  return (
    <View className="px-4 pt-4 gap-4">
      <View className="flex-row gap-4">
        <Skeleton style={{ width: 88, height: 88, borderRadius: 44 }} />
        <View className="flex-1 gap-2 pt-2">
          <Skeleton className="h-5 w-2/3 rounded" />
          <Skeleton className="h-3 w-1/3 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </View>
      </View>
      <Skeleton className="h-16 rounded-2xl" />
    </View>
  );
}

function NotFound({ handle, onBack }: { handle: string; onBack: () => void }) {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <View
        className="h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: BRAND_RGBA(0.12) }}
      >
        <Users size={24} color={BRAND} />
      </View>
      <Text className="mt-4 text-lg font-bold text-foreground">
        Profile not found
      </Text>
      <Text className="mt-1 text-center text-sm text-muted-foreground">
        @{handle} doesn't exist on EVO TV — or the account was removed.
      </Text>
      <Pressable
        onPress={onBack}
        className="mt-6 rounded-xl px-4 py-2.5"
        style={{ backgroundColor: BRAND }}
      >
        <Text style={{ color: "#0a0a0a", fontWeight: "700", fontSize: 13 }}>
          Back home
        </Text>
      </Pressable>
    </View>
  );
}

function ChannelCard({ channel }: { channel: PublicProfileChannel }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/c/${channel.slug}` as never)}
      className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3 active:opacity-80"
    >
      <View className="h-12 w-12 overflow-hidden rounded-xl bg-muted">
        {channel.logoUrl ? (
          <Image
            source={channel.logoUrl}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : null}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
            {channel.name}
          </Text>
          {channel.isVerified ? (
            <BadgeCheck size={14} color={BRAND} fill={BRAND_RGBA(0.18)} />
          ) : null}
        </View>
        <Text className="text-xs text-muted-foreground">
          {channel.category} · {formatCount(channel.followerCount)} followers
        </Text>
      </View>
    </Pressable>
  );
}

function ClipCard({ clip }: { clip: PublicProfileClip }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/clips/${clip.id}` as never)}
      className="overflow-hidden rounded-xl border border-border bg-card active:opacity-80"
      style={{ width: 200 }}
    >
      <View style={{ aspectRatio: 16 / 9, position: "relative" }}>
        {clip.thumbnailUrl ? (
          <Image
            source={clip.thumbnailUrl}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <View className="h-full w-full items-center justify-center bg-muted">
            <Play size={24} color="#525252" />
          </View>
        )}
        <View
          className="absolute bottom-1.5 right-1.5 rounded-md px-1.5 py-0.5"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "600" }}>
            {formatDuration(clip.durationSec)}
          </Text>
        </View>
      </View>
      <View className="p-2.5">
        <Text className="text-xs font-medium text-foreground" numberOfLines={2}>
          {clip.title}
        </Text>
        <View className="mt-1 flex-row items-center gap-1">
          <Eye size={10} color="#737373" />
          <Text className="text-[10px] text-muted-foreground">
            {formatCount(clip.viewCount)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function VodCard({ vod }: { vod: PublicProfileVod }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/vod/${vod.id}` as never)}
      className="overflow-hidden rounded-xl border border-border bg-card active:opacity-80"
      style={{ width: 260 }}
    >
      <View style={{ aspectRatio: 16 / 9, position: "relative" }}>
        {vod.thumbnailUrl ? (
          <Image
            source={vod.thumbnailUrl}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <View className="h-full w-full items-center justify-center bg-muted">
            <Tv2 size={28} color="#525252" />
          </View>
        )}
        <View
          className="absolute bottom-1.5 right-1.5 rounded-md px-1.5 py-0.5"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "600" }}>
            {formatDuration(vod.durationSec)}
          </Text>
        </View>
      </View>
      <View className="p-3">
        <Text className="text-sm font-medium text-foreground" numberOfLines={2}>
          {vod.title}
        </Text>
        <View className="mt-1 flex-row items-center gap-1">
          <Eye size={11} color="#737373" />
          <Text className="text-[11px] text-muted-foreground">
            {formatCount(vod.viewCount)} views
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function PublicProfileScreen() {
  const { handle: raw } = useLocalSearchParams<{ handle: string }>();
  const handle = (raw ?? "").replace(/^@/, "").trim();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useMockAuth();
  const viewerId = user?.id ?? null;

  const profileQ = useQuery({
    queryKey: ["public-profile", handle],
    queryFn: () => getPublicProfileByHandle(handle),
    enabled: handle.length > 0,
  });

  const [followingLocal, setFollowingLocal] = React.useState<boolean | null>(
    null,
  );
  React.useEffect(() => {
    if (profileQ.data) setFollowingLocal(profileQ.data.isFollowing);
  }, [profileQ.data]);

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!profileQ.data) return false;
      return apiToggleFollow("streamer", profileQ.data.id);
    },
    onMutate: () => {
      setFollowingLocal((v) => (v === null ? null : !v));
    },
    onError: () => {
      setFollowingLocal((v) => (v === null ? null : !v));
      toast.error("Could not update follow. Try again.");
    },
    onSuccess: (newState) => {
      setFollowingLocal(newState);
      qc.invalidateQueries({ queryKey: ["public-profile", handle] });
    },
  });

  if (!handle) {
    return <NotFound handle="" onBack={() => router.replace("/home" as never)} />;
  }

  return (
    <>
      <Stack.Screen options={{ title: `@${handle}` }} />
      {profileQ.isLoading ? (
        <View className="flex-1 bg-background">
          <HeaderSkeleton />
        </View>
      ) : !profileQ.data ? (
        <NotFound
          handle={handle}
          onBack={() => router.replace("/home" as never)}
        />
      ) : (
        <ScrollView
          className="flex-1 bg-background"
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* HERO */}
          <View className="px-4 pt-4 gap-4">
            <View className="flex-row gap-4">
              <View className="h-22 w-22 overflow-hidden rounded-full bg-muted" style={{ height: 88, width: 88 }}>
                {profileQ.data.avatarUrl ? (
                  <Image
                    source={profileQ.data.avatarUrl}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                ) : (
                  <View className="h-full w-full items-center justify-center">
                    <Text style={{ color: "#737373", fontSize: 28, fontWeight: "700" }}>
                      {profileQ.data.displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <View className="flex-1 pt-1">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
                    {profileQ.data.displayName}
                  </Text>
                  {profileQ.data.channels.some((c) => c.isVerified) ? (
                    <BadgeCheck size={16} color={BRAND} fill={BRAND_RGBA(0.18)} />
                  ) : null}
                </View>
                <Text className="text-sm text-muted-foreground">
                  @{profileQ.data.handle}
                </Text>
                <View className="mt-1.5 flex-row items-center gap-3 flex-wrap">
                  <View className="flex-row items-center gap-1">
                    <Users size={11} color="#a3a3a3" />
                    <Text className="text-xs text-muted-foreground">
                      {formatCount(profileQ.data.followerCount)} followers
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Calendar size={11} color="#a3a3a3" />
                    <Text className="text-xs text-muted-foreground">
                      Joined {formatJoined(profileQ.data.joinedAt)}
                    </Text>
                  </View>
                  {profileQ.data.country ? (
                    <View className="flex-row items-center gap-1">
                      <MapPin size={11} color="#a3a3a3" />
                      <Text className="text-xs text-muted-foreground">
                        {profileQ.data.country}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* Bio */}
            {profileQ.data.bio ? (
              <View className="rounded-2xl border border-border bg-card p-4">
                <Text className="text-sm text-foreground/85">
                  {profileQ.data.bio}
                </Text>
              </View>
            ) : null}

            {/* Actions */}
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => {
                  if (!viewerId) {
                    router.push("/login" as never);
                    return;
                  }
                  if (!profileQ.data) return;
                  if (viewerId === profileQ.data.id) {
                    router.push("/profile" as never);
                    return;
                  }
                  followMutation.mutate();
                }}
                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 active:opacity-80"
                style={{
                  backgroundColor:
                    followingLocal && viewerId
                      ? "transparent"
                      : BRAND,
                  borderWidth: followingLocal && viewerId ? 1 : 0,
                  borderColor: BRAND_RGBA(0.4),
                }}
                disabled={followMutation.isPending}
              >
                {followingLocal && viewerId ? (
                  <>
                    <UserCheck size={14} color={BRAND} />
                    <Text style={{ color: BRAND, fontWeight: "700", fontSize: 13 }}>
                      Following
                    </Text>
                  </>
                ) : (
                  <>
                    <UserPlus size={14} color="#0a0a0a" />
                    <Text style={{ color: "#0a0a0a", fontWeight: "700", fontSize: 13 }}>
                      {viewerId ? "Follow" : "Sign in to follow"}
                    </Text>
                  </>
                )}
              </Pressable>
              {viewerId && viewerId !== profileQ.data.id ? (
                <Pressable
                  onPress={() =>
                    router.push(
                      `/report?targetType=user&targetId=${profileQ.data!.id}` as never,
                    )
                  }
                  className="flex-row items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 active:opacity-70"
                >
                  <Flag size={13} color="#a3a3a3" />
                  <Text className="text-xs text-muted-foreground">Report</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* CHANNELS */}
          {profileQ.data.channels.length > 0 ? (
            <View className="px-4 pt-8 gap-3">
              <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Channels
              </Text>
              {profileQ.data.channels.map((c) => (
                <ChannelCard key={c.id} channel={c} />
              ))}
            </View>
          ) : null}

          {/* CLIPS */}
          {profileQ.data.recentClips.length > 0 ? (
            <View className="pt-8 gap-3">
              <View className="flex-row items-center justify-between px-4">
                <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Recent clips
                </Text>
                <Badge
                  variant="outline"
                  className="border-border"
                  textClassName="text-muted-foreground"
                >
                  {profileQ.data.recentClips.length}
                </Badge>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              >
                {profileQ.data.recentClips.map((c) => (
                  <ClipCard key={c.id} clip={c} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* VODS */}
          {profileQ.data.recentVods.length > 0 ? (
            <View className="pt-8 gap-3">
              <View className="flex-row items-center justify-between px-4">
                <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Recent VODs
                </Text>
                <Badge
                  variant="outline"
                  className="border-border"
                  textClassName="text-muted-foreground"
                >
                  {profileQ.data.recentVods.length}
                </Badge>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              >
                {profileQ.data.recentVods.map((v) => (
                  <VodCard key={v.id} vod={v} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Empty content state */}
          {profileQ.data.recentClips.length === 0 &&
          profileQ.data.recentVods.length === 0 &&
          profileQ.data.channels.length === 0 ? (
            <View className="mx-4 mt-8 rounded-2xl border border-dashed border-border bg-card p-8">
              <Text className="text-center text-sm text-muted-foreground">
                @{profileQ.data.handle} hasn't posted any clips or VODs yet.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </>
  );
}
