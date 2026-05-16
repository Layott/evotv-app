import * as React from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Download } from "lucide-react-native";

import {
  listAppPlatforms,
  type AppKind,
  type AppPlatform,
} from "@/lib/mock/apps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlatformIcon, StatusPill } from "@/components/apps/platform-bits";

const KIND_TO_PATH: Record<AppKind, string> = {
  tv: "/apps/tv",
  android: "/apps/android",
  ios: "/apps/ios",
  windows: "/apps/desktop",
  macos: "/apps/desktop",
  linux: "/apps/desktop",
};

const FAMILY_LABEL: Record<AppPlatform["family"], string> = {
  tv: "TV apps",
  mobile: "Mobile apps",
  desktop: "Desktop apps",
};

interface AppCardProps {
  app: AppPlatform;
  onPress: () => void;
}

function AppCard({ app, onPress }: AppCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border border-border bg-card p-5 gap-3 active:opacity-80"
    >
      <View className="flex-row items-center justify-between">
        <View
          className="h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: "rgba(64,64,64,0.6)" }}
        >
          <PlatformIcon kind={app.kind} size={22} />
        </View>
        <StatusPill status={app.status} />
      </View>
      <View>
        <Text className="text-base font-semibold text-foreground">
          {app.name}
        </Text>
        <Text
          className="mt-1 text-sm text-muted-foreground"
          numberOfLines={2}
        >
          {app.blurb}
        </Text>
      </View>
      <View className="flex-row items-center justify-between border-t border-border pt-3">
        <Text className="text-xs text-muted-foreground">
          {app.version ? `v${app.version}` : "Coming soon"}
        </Text>
        <View className="flex-row items-center gap-1">
          <Text
            style={{ color: "#2CD7E3", fontSize: 12, fontWeight: "600" }}
          >
            Install
          </Text>
          <ArrowRight size={13} color="#2CD7E3" />
        </View>
      </View>
    </Pressable>
  );
}

export default function AppsScreen() {
  const router = useRouter();
  const { data: apps, isLoading } = useQuery({
    queryKey: ["apps"],
    queryFn: () => listAppPlatforms(),
  });

  const grouped = React.useMemo(() => {
    return (apps ?? []).reduce<Record<AppPlatform["family"], AppPlatform[]>>(
      (acc, app) => {
        (acc[app.family] ||= []).push(app);
        return acc;
      },
      { tv: [], mobile: [], desktop: [] },
    );
  }, [apps]);

  return (
    <>
      <Stack.Screen options={{ title: "Apps" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-4 pt-6 gap-3 items-center">
          <Badge
            variant="outline"
            className="border-brand"
            textClassName="text-brand"
          >
            <Download size={11} color="#2CD7E3" /> EVO TV everywhere
          </Badge>
          <Text className="text-2xl font-bold text-foreground text-center">
            Watch EVO TV on every screen.
          </Text>
          <Text className="text-sm text-muted-foreground text-center">
            Mobile, desktop, and the big screen. The same EVO TV — esports,
            anime, and lifestyle — exactly where you want it.
          </Text>
        </View>

        {isLoading ? (
          <View className="px-4 pt-8 gap-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} style={{ height: 160, borderRadius: 16 }} />
            ))}
          </View>
        ) : (
          <View className="px-4 pt-8 gap-8">
            {(["tv", "mobile", "desktop"] as const).map((family) => (
              <View key={family} className="gap-3">
                <Text className="text-base font-semibold text-foreground">
                  {FAMILY_LABEL[family]}
                </Text>
                <View className="gap-3">
                  {grouped[family].map((a) => (
                    <AppCard
                      key={a.id}
                      app={a}
                      onPress={() => router.push(KIND_TO_PATH[a.kind] as never)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        <View className="mx-4 mt-10 rounded-2xl border border-border bg-card p-6 gap-3 items-center">
          <Text className="text-base font-semibold text-foreground text-center">
            No app for your device?
          </Text>
          <Text className="text-sm text-muted-foreground text-center">
            The web app at evo.tv works on any modern browser — phone, tablet,
            console, or smart fridge.
          </Text>
          <Button
            className="bg-brand"
            textClassName="text-black font-semibold"
            onPress={() => Linking.openURL("https://evo.tv")}
          >
            Open EVO TV in the browser
          </Button>
        </View>
      </ScrollView>
    </>
  );
}
