import * as React from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, useRouter } from "expo-router";

/**
 * Deep-link landing screen for OAuth flows.
 *
 * `WebBrowser.openAuthSessionAsync` in AuthProvider.signInWithSocial captures
 * the `evotv://oauth#token=<bearer>` redirect and processes the token in JS.
 * However on Android the OS may *also* surface the deep link to expo-router,
 * which would otherwise render the +not-found screen. This stub absorbs that
 * navigation and bounces the user home.
 */
export default function OAuthLandingScreen() {
  const router = useRouter();

  React.useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/(public)/home");
    }, 100);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0A0A0A",
        }}
      >
        <ActivityIndicator size="large" color="#2CD7E3" />
      </View>
    </>
  );
}
