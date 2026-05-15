import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { ChevronRight, Key, MessageSquare, Radio, ShieldCheck } from "lucide-react-native";

import { useMockAuth } from "@/components/providers";

export default function ChannelHomeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { publisherMemberships } = useMockAuth();

  const match = publisherMemberships
    .flatMap((m) => m.channels.map((c) => ({ ...c, publisher: m.publisher, role: m.role })))
    .find((c) => c.id === id);

  if (!match) {
    return (
      <>
        <Stack.Screen options={{ title: "Channel" }} />
        <View className="flex-1 items-center justify-center bg-background">
          <Text className="text-sm text-muted-foreground">Channel not found.</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: match.name }} />
      <ScrollView className="flex-1 bg-background">
        <View className="px-5 py-6">
          <View className="flex-row items-center gap-2">
            <Radio size={22} color="#2CD7E3" />
            <Text className="text-2xl font-bold text-foreground" numberOfLines={1}>
              {match.name}
            </Text>
            {match.isVerified ? (
              <ShieldCheck size={16} color="#2CD7E3" />
            ) : null}
          </View>
          <Text className="mt-1 text-xs text-muted-foreground">
            {match.publisher.name} · @{match.slug} · role: {match.role}
          </Text>

          <View className="mt-5 gap-2">
            <NavRow
              href={`/(partner)/channels/${id}/stream-key` as never}
              icon={<Key size={16} color="#FAFAFA" />}
              title="Stream key"
              subtitle="View status, rotate to issue a new RTMP key"
            />
            <NavRow
              href={`/(partner)/channels/${id}/analytics` as never}
              icon={<ShieldCheck size={16} color="#FAFAFA" />}
              title="Analytics"
              subtitle="Daily rollup — views, watch time, tips"
            />
            <NavRow
              href={`/(partner)/channels/${id}/mod` as never}
              icon={<MessageSquare size={16} color="#FAFAFA" />}
              title="Chat moderation"
              subtitle="Pin, delete, timeout — live during broadcasts"
            />
          </View>
        </View>
      </ScrollView>
    </>
  );
}

function NavRow({
  href,
  icon,
  title,
  subtitle,
}: {
  href: React.ComponentProps<typeof Link>["href"];
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link href={href} asChild>
      <Pressable className="flex-row items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 active:opacity-80">
        <View
          className="h-9 w-9 items-center justify-center rounded-md"
          style={{ backgroundColor: "#1f1f1f" }}
        >
          {icon}
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">{title}</Text>
          <Text className="text-[11px] text-muted-foreground">{subtitle}</Text>
        </View>
        <ChevronRight size={16} color="#737373" />
      </Pressable>
    </Link>
  );
}
