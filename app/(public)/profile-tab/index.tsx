import * as React from "react";
import { View } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";

/**
 * The Profile tab is a redirect target — the real Profile screen lives at
 * /(authed)/profile/index.tsx. Native Expo Router doesn't unmount the Tabs
 * navigator gracefully when a Tabs.Screen child returns <Redirect/> at render
 * time (leaves a blank frame). Imperative `router.replace` inside a focus
 * effect navigates cleanly on both platforms.
 *
 * Tab press is also intercepted in (public)/_layout.tsx via `listeners` so
 * the redirect target is hit immediately on tap without rendering this stub.
 */
export default function ProfileTabRedirect() {
  const router = useRouter();
  useFocusEffect(
    React.useCallback(() => {
      router.replace("/profile" as never);
    }, [router]),
  );
  return <View style={{ flex: 1, backgroundColor: "#0A0A0A" }} />;
}
