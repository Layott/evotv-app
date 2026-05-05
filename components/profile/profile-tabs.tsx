import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Eye, Film, Info, Video } from "lucide-react-native";

import type { Clip, Profile, Vod } from "@/lib/types";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface ProfileTabsProps {
  profile: Profile;
  videos?: Vod[];
  clips?: Clip[];
  defaultValue?: "videos" | "clips" | "about";
}

function formatViewers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function VideoGrid({ vods }: { vods: Vod[] }) {
  const router = useRouter();
  if (vods.length === 0) {
    return (
      <View
        className="rounded-2xl border border-dashed border-border bg-card p-8"
      >
        <View className="items-center">
          <Video size={32} color="#525252" />
        </View>
        <Text className="mt-3 text-center text-sm font-semibold text-foreground">
          No videos yet
        </Text>
      </View>
    );
  }

  // 2-col grid
  const rows: Vod[][] = [];
  for (let i = 0; i < vods.length; i += 2) rows.push(vods.slice(i, i + 2));
  return (
    <View className="gap-3">
      {rows.map((row, idx) => (
        <View key={idx} className="flex-row gap-3">
          {row.map((v) => (
            <Pressable
              key={v.id}
              onPress={() => router.push(`/vod/${v.id}`)}
              className="flex-1 overflow-hidden rounded-xl border border-border bg-card active:opacity-80"
            >
              <View
                style={{ aspectRatio: 16 / 9 }}
                className="overflow-hidden"
              >
                <Image
                  source={v.thumbnailUrl}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              </View>
              <View className="gap-1 p-2">
                <Text
                  className="text-xs font-semibold text-foreground"
                  numberOfLines={2}
                >
                  {v.title}
                </Text>
                <View className="flex-row items-center gap-1">
                  <Eye size={10} color="#737373" />
                  <Text style={{ fontSize: 10, color: "#737373" }}>
                    {formatViewers(v.viewCount)}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
          {row.length === 1 ? <View className="flex-1" /> : null}
        </View>
      ))}
    </View>
  );
}

function ClipsGrid({ clips }: { clips: Clip[] }) {
  const router = useRouter();
  if (clips.length === 0) {
    return (
      <View
        className="rounded-2xl border border-dashed border-border bg-card p-8"
      >
        <View className="items-center">
          <Film size={32} color="#525252" />
        </View>
        <Text className="mt-3 text-center text-sm font-semibold text-foreground">
          No clips yet
        </Text>
      </View>
    );
  }

  const rows: Clip[][] = [];
  for (let i = 0; i < clips.length; i += 3) rows.push(clips.slice(i, i + 3));
  return (
    <View className="gap-3">
      {rows.map((row, idx) => (
        <View key={idx} className="flex-row gap-2">
          {row.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => router.push(`/clips/${c.id}`)}
              className="flex-1 overflow-hidden rounded-xl border border-border bg-card active:opacity-80"
              style={{ aspectRatio: 9 / 16 }}
            >
              <Image
                source={c.thumbnailUrl}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
              <View
                className="absolute inset-x-0 bottom-0 p-2"
                style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
              >
                <Text
                  className="text-[10px] font-semibold text-white"
                  numberOfLines={1}
                >
                  {c.title}
                </Text>
              </View>
            </Pressable>
          ))}
          {row.length < 3
            ? Array.from({ length: 3 - row.length }).map((_, k) => (
                <View key={`pad-${k}`} className="flex-1" />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}

function AboutPanel({ profile }: { profile: Profile }) {
  return (
    <View className="gap-4">
      <View className="rounded-xl border border-border bg-card p-4">
        <Text className="text-sm font-semibold text-foreground">Bio</Text>
        <Text className="mt-2 text-sm text-neutral-300">
          {profile.bio || "No bio yet."}
        </Text>
      </View>
      <View className="rounded-xl border border-border bg-card p-4">
        <Text className="text-sm font-semibold text-foreground">Details</Text>
        <View className="mt-2 gap-2">
          <Row label="Country" value={profile.country} />
          <Row label="Handle" value={`@${profile.handle}`} />
          <Row label="Role" value={profile.role} />
          <Row
            label="Joined"
            value={new Date(profile.createdAt).toLocaleDateString()}
          />
        </View>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className="text-xs text-foreground">{value}</Text>
    </View>
  );
}

export function ProfileTabs({
  profile,
  videos = [],
  clips = [],
  defaultValue = "videos",
}: ProfileTabsProps) {
  return (
    <Tabs defaultValue={defaultValue} className="gap-4">
      <TabsList>
        <TabsTrigger value="videos">
          <Video size={14} color="#a3a3a3" />
          <Text className="text-sm font-medium">Videos</Text>
        </TabsTrigger>
        <TabsTrigger value="clips">
          <Film size={14} color="#a3a3a3" />
          <Text className="text-sm font-medium">Clips</Text>
        </TabsTrigger>
        <TabsTrigger value="about">
          <Info size={14} color="#a3a3a3" />
          <Text className="text-sm font-medium">About</Text>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="videos">
        <VideoGrid vods={videos} />
      </TabsContent>
      <TabsContent value="clips">
        <ClipsGrid clips={clips} />
      </TabsContent>
      <TabsContent value="about">
        <AboutPanel profile={profile} />
      </TabsContent>
    </Tabs>
  );
}

export default ProfileTabs;
