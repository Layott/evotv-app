import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Link, Stack } from "expo-router";
import { ArrowRight, Radio } from "lucide-react-native";

import { useMockAuth } from "@/components/providers";

export default function ChannelsListScreen() {
  const { publisherMemberships } = useMockAuth();
  const channels = publisherMemberships.flatMap((m) =>
    m.channels.map((c) => ({ ...c, publisherName: m.publisher.name })),
  );

  return (
    <>
      <Stack.Screen options={{ title: "Channels" }} />
      <ScrollView className="flex-1 bg-background">
        <View className="px-5 py-6 gap-2">
          {channels.length === 0 ? (
            <Text className="text-sm text-muted-foreground">
              No channels yet.
            </Text>
          ) : null}
          {channels.map((c) => (
            <Link
              key={c.id}
              href={`/(partner)/channels/${c.id}` as never}
              asChild
            >
              <Pressable className="flex-row items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 active:opacity-80">
                <View
                  className="h-10 w-10 items-center justify-center rounded-md"
                  style={{ backgroundColor: "#1f1f1f" }}
                >
                  <Radio size={18} color="#2CD7E3" />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-sm font-semibold text-foreground"
                    numberOfLines={1}
                  >
                    {c.name}
                  </Text>
                  <Text className="text-[11px] text-muted-foreground">
                    {c.publisherName} · @{c.slug} ·{" "}
                    {c.followerCount.toLocaleString()} followers
                  </Text>
                </View>
                <ArrowRight size={16} color="#737373" />
              </Pressable>
            </Link>
          ))}
        </View>
      </ScrollView>
    </>
  );
}
