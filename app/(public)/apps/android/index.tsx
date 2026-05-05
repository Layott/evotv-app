import * as React from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { getAppPlatform } from "@/lib/mock/apps";
import { Skeleton } from "@/components/ui/skeleton";
import { StoreLanding } from "@/components/apps/store-landing";

export default function AppsAndroidScreen() {
  const { data: app, isLoading } = useQuery({
    queryKey: ["apps", "android"],
    queryFn: () => getAppPlatform("android"),
  });

  if (isLoading || !app) {
    return (
      <>
        <Stack.Screen options={{ title: "Android" }} />
        <View className="flex-1 bg-background gap-3 p-4">
          <Skeleton style={{ height: 32, width: "60%" }} />
          <Skeleton style={{ height: 200, borderRadius: 16 }} />
          <Skeleton style={{ height: 80, borderRadius: 16 }} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Android" }} />
      <StoreLanding
        app={app}
        storeName="Play Store"
        storeAccent="google"
        features={[
          {
            title: "Picture-in-Picture",
            body: "Keep the match floating while you reply to messages or hop between apps.",
          },
          {
            title: "Data saver",
            body: "Smart bitrate that ratchets down when you're on cellular without crushing quality.",
          },
          {
            title: "Push when live",
            body: "Pick the teams you follow. Wake-up nudges only when something you care about kicks off.",
          },
        ]}
      />
    </>
  );
}
