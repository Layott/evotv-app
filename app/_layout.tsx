import "../global.css";

import { KeyboardAvoidingView, Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Providers } from "@/components/providers";
import { SplashGate } from "@/components/providers/splash-gate";
import { initSentry } from "@/sentry.config";

initSentry();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Providers>
          <SplashGate>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={{ flex: 1 }}
            >
              <StatusBar style="light" />
              <Stack
                screenOptions={{
                  headerStyle: { backgroundColor: "#0A0A0A" },
                  headerTintColor: "#FAFAFA",
                  headerTitleStyle: { color: "#FAFAFA" },
                  contentStyle: { backgroundColor: "#0A0A0A" },
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
            </KeyboardAvoidingView>
          </SplashGate>
        </Providers>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
