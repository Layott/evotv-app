import * as React from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { getAppPlatform } from "@/lib/mock/apps";
import { Skeleton } from "@/components/ui/skeleton";
import { StoreLanding } from "@/components/apps/store-landing";

export default function AppsIosScreen() {
  const { data: app, isLoading } = useQuery({
    queryKey: ["apps", "ios"],
    queryFn: () => getAppPlatform("ios"),
  });

  if (isLoading || !app) {
    return (
      <>
        <Stack.Screen options={{ title: "iOS" }} />
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
      <Stack.Screen options={{ title: "iOS" }} />
      <StoreLanding
        app={app}
        storeName="App Store"
        storeAccent="apple"
        features={[
          {
            title: "Native AirPlay",
            body: "One tap to push the live broadcast onto your Apple TV without missing a play.",
          },
          {
            title: "SharePlay Watch Together",
            body: "Catch finals over FaceTime with synced playback and shared chat.",
          },
          {
            title: "iPad-class layouts",
            body: "Multi-column film-room on the iPad with sidebar chat, brackets and stats.",
          },
        ]}
      />
    </>
  );
}
