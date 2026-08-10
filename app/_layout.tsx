import "../global.css";

import { KeyboardAvoidingView, Platform, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Providers } from "@/components/providers";
import { SplashGate } from "@/components/providers/splash-gate";
import { ErrorBoundary } from "@/components/providers/error-boundary";
import { GlobalBanner } from "@/components/common/global-banner";
import { initSentry } from "@/sentry.config";

initSentry();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
        <Providers>
          <SplashGate>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={{ flex: 1 }}
            >
              {/* Opaque status bar: the OS reserves the status-bar area on
                  every screen so app content never renders under the device
                  clock/battery/network. iOS ignores these (handled by safe-area
                  insets); Android gets a solid black bar. */}
              <StatusBar style="light" backgroundColor="#000000" translucent={false} />
              <View style={{ flex: 1 }}>
                <GlobalBanner />
                <Stack
                  screenOptions={{
                    headerStyle: { backgroundColor: "#05191B" },
                    headerTintColor: "#EAF6F5",
                    headerTitleStyle: { color: "#EAF6F5" },
                    contentStyle: { backgroundColor: "#05191B" },
                    animation: "slide_from_right",
                  }}
                >
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(public)" options={{ headerShown: false }} />
                  <Stack.Screen name="(authed)" options={{ headerShown: false }} />
                  <Stack.Screen name="(admin)" options={{ headerShown: false }} />
                  <Stack.Screen name="(partner)" options={{ headerShown: false }} />
                  <Stack.Screen name="(embed)" options={{ headerShown: false }} />
                </Stack>
              </View>
            </KeyboardAvoidingView>
          </SplashGate>
        </Providers>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
