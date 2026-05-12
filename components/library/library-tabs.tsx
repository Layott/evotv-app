import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Bookmark, Download, History, Users } from "lucide-react-native";

import type { Vod } from "@/lib/types";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export interface FollowingItem {
  id: string;
  name: string;
  imageUrl: string;
  href: string;
  subtitle?: string;
}

interface LibraryTabsProps {
  downloads?: Vod[];
  watchLater?: Vod[];
  history?: Vod[];
  following?: FollowingItem[];
  defaultValue?: "downloads" | "watch-later" | "history" | "following";
}

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <View
      className="rounded-2xl border border-dashed border-border bg-card p-8"
    >
      <View className="items-center">{icon}</View>
      <Text className="mt-3 text-center text-sm font-semibold text-foreground">
        {title}
      </Text>
      <Text className="mt-1 text-center text-xs text-muted-foreground">
        {body}
      </Text>
    </View>
  );
}

function VodRow({ vod }: { vod: Vod }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/vod/${vod.id}`)}
      className="flex-row gap-3 rounded-xl border border-border bg-card p-3 active:opacity-80"
    >
      <View
        className="overflow-hidden rounded-md"
        style={{ width: 120, aspectRatio: 16 / 9, backgroundColor: "#262626" }}
      >
        <Image
          source={vod.thumbnailUrl}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
      </View>
      <View className="min-w-0 flex-1">
        <Text
          className="text-sm font-semibold text-foreground"
          numberOfLines={2}
        >
          {vod.title}
        </Text>
        <Text className="mt-1 text-xs text-muted-foreground">
          {Math.floor(vod.durationSec / 60)} min
        </Text>
      </View>
    </Pressable>
  );
}

function VodList({ vods, emptyTitle, emptyBody, emptyIcon }: {
  vods: Vod[];
  emptyTitle: string;
  emptyBody: string;
  emptyIcon: React.ReactNode;
}) {
  if (vods.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} body={emptyBody} />;
  }
  return (
    <View className="gap-3">
      {vods.map((v) => (
        <VodRow key={v.id} vod={v} />
      ))}
    </View>
  );
}

function FollowingList({ items }: { items: FollowingItem[] }) {
  const router = useRouter();
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Users size={32} color="#525252" />}
        title="Not following anyone yet"
        body="Find creators, teams, and players to follow."
      />
    );
  }
  return (
    <View className="gap-2">
      {items.map((it) => (
        <Pressable
          key={it.id}
          onPress={() => router.push(it.href as never)}
          className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3 active:opacity-80"
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              overflow: "hidden",
              backgroundColor: "#262626",
            }}
          >
            <Image
              source={it.imageUrl}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          </View>
          <View className="min-w-0 flex-1">
            <Text
              className="text-sm font-semibold text-foreground"
              numberOfLines={1}
            >
              {it.name}
            </Text>
            {it.subtitle ? (
              <Text
                className="text-xs text-muted-foreground"
                numberOfLines={1}
              >
                {it.subtitle}
              </Text>
            ) : null}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export function LibraryTabs({
  downloads = [],
  watchLater = [],
  history = [],
  following = [],
  defaultValue = "downloads",
}: LibraryTabsProps) {
  return (
    <Tabs defaultValue={defaultValue} className="gap-4">
      <TabsList>
        <TabsTrigger value="downloads">Downloads</TabsTrigger>
        <TabsTrigger value="watch-later">Watch Later</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
        <TabsTrigger value="following">Following</TabsTrigger>
      </TabsList>

      <TabsContent value="downloads">
        <VodList
          vods={downloads}
          emptyIcon={<Download size={32} color="#525252" />}
          emptyTitle="Nothing downloaded yet"
          emptyBody='Tap "Download for offline" on any VOD page.'
        />
      </TabsContent>

      <TabsContent value="watch-later">
        <VodList
          vods={watchLater}
          emptyIcon={<Bookmark size={32} color="#525252" />}
          emptyTitle="No saved videos"
          emptyBody="Tap the bookmark icon to save videos for later."
        />
      </TabsContent>

      <TabsContent value="history">
        <VodList
          vods={history}
          emptyIcon={<History size={32} color="#525252" />}
          emptyTitle="No watch history"
          emptyBody="Videos you watch will show up here."
        />
      </TabsContent>

      <TabsContent value="following">
        <FollowingList items={following} />
      </TabsContent>
    </Tabs>
  );
}

export default LibraryTabs;
