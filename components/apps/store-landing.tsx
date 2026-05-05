import * as React from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ArrowLeft, Download, Sparkles } from "lucide-react-native";

import type { AppPlatform } from "@/lib/mock/apps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlatformIcon, StatusPill } from "./platform-bits";

export interface StoreFeature {
  title: string;
  body: string;
}

interface StoreLandingProps {
  app: AppPlatform;
  storeName: string;
  storeAccent: "google" | "apple";
  features: StoreFeature[];
}

function ScreenshotStrip({ shots }: { shots: string[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
    >
      {shots.map((s, i) => (
        <View
          key={`shot-${i}`}
          style={{ width: 220, aspectRatio: 9 / 16 }}
          className="overflow-hidden rounded-[28px] border border-border bg-card"
        >
          <Image
            source={s}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        </View>
      ))}
    </ScrollView>
  );
}

export function StoreLanding({
  app,
  storeName,
  storeAccent,
  features,
}: StoreLandingProps) {
  const router = useRouter();

  const accentBg =
    storeAccent === "google" ? "rgba(34,197,94,0.15)" : "rgba(231,231,231,0.15)";
  const accentFg = storeAccent === "google" ? "#4ade80" : "#e5e5e5";

  const onInstall = () => {
    if (app.storeUrl) {
      Linking.openURL(app.storeUrl).catch(() => {
        // ignore
      });
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <View className="px-4 pt-4">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center gap-1 active:opacity-70"
        >
          <ArrowLeft size={13} color="#a3a3a3" />
          <Text className="text-xs text-muted-foreground">All apps</Text>
        </Pressable>
      </View>

      <View className="px-4 pt-4 gap-3 items-start">
        <View
          className="h-14 w-14 items-center justify-center rounded-2xl"
          style={{ backgroundColor: accentBg }}
        >
          <PlatformIcon kind={app.kind} size={28} color={accentFg} />
        </View>
        <Badge
          variant="outline"
          className="border-brand"
          textClassName="text-brand"
        >
          <Download size={11} color="#2CD7E3" /> {storeName}
        </Badge>
        <Text className="text-3xl font-bold text-foreground">{app.name}</Text>
        <Text className="text-sm text-muted-foreground">{app.blurb}</Text>
        <View className="flex-row items-center gap-3 mt-1">
          <StatusPill status={app.status} />
          <Text className="text-xs text-muted-foreground">
            v{app.version} · {app.size}
          </Text>
        </View>

        <View className="mt-3 w-full gap-2">
          <Button
            className="bg-brand"
            textClassName="text-black font-semibold"
            onPress={onInstall}
            disabled={!app.storeUrl}
          >
            <Download size={16} color="#000" />
            Get on {storeName}
          </Button>
          {app.storeUrl ? (
            <Text
              className="text-xs text-muted-foreground"
              numberOfLines={1}
            >
              {app.storeUrl}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="mt-6">
        <ScreenshotStrip shots={app.screenshots} />
      </View>

      <View className="px-4 pt-8 gap-3">
        {features.map((f) => (
          <View
            key={f.title}
            className="rounded-2xl border border-border bg-card p-5 gap-2"
          >
            <Sparkles size={18} color="#fbbf24" />
            <Text className="text-base font-semibold text-foreground">
              {f.title}
            </Text>
            <Text className="text-sm text-muted-foreground">{f.body}</Text>
          </View>
        ))}
      </View>

      <View className="mx-4 mt-8 rounded-2xl border border-border bg-card p-6 gap-3 items-center">
        <Text className="text-base font-semibold text-foreground text-center">
          Prefer the web app?
        </Text>
        <Text className="text-sm text-muted-foreground text-center">
          The browser version of EVO TV runs on any modern device.
        </Text>
        <Button
          variant="outline"
          onPress={() => Linking.openURL("https://evo.tv")}
        >
          Open EVO TV in browser
        </Button>
      </View>
    </ScrollView>
  );
}
