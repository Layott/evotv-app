import "../global.css";
import { useColorScheme } from "nativewind";
import { useTokens } from "@/lib/theme/tokens";

import { KeyboardAvoidingView, Platform, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Providers } from "@/components/providers";
import { SplashGate } from "@/components/providers/splash-gate";
import { AppLockGate } from "@/components/providers/app-lock-gate";
import { ErrorBoundary } from "@/components/providers/error-boundary";
import { GlobalBanner } from "@/components/common/global-banner";
import { initSentry } from "@/sentry.config";
import { applyDefaultTextFont } from "@/lib/theme/default-text-font";

initSentry();

// Before any screen renders. React Native has no cascade, so a <Text> with no
// font class falls back to the system face; this gives them all Archivo.
applyDefaultTextFont();

export default function RootLayout() {
  /*
   * Read here rather than inside `Providers`, because the navigator chrome and
   * the status bar are rendered by this component. NativeWind's colour scheme
   * is a global store, not React context, so it is readable above ThemeProvider
   * and still reflects what ThemeProvider set.
   */
  const t = useTokens();
  const { colorScheme: scheme } = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
        <Providers>
          <SplashGate>
            <AppLockGate>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={{ flex: 1 }}
            >
              {/* Opaque status bar: the OS reserves the status-bar area on
                  every screen so app content never renders under the device
                  clock/battery/network. iOS ignores these (handled by safe-area
                  insets); Android gets a solid black bar. */}
              <StatusBar style={scheme === "light" ? "dark" : "light"} backgroundColor={t.bg} translucent={false} />
              <View style={{ flex: 1 }}>
                <GlobalBanner />
                <Stack
                  screenOptions={{
                    headerStyle: { backgroundColor: t.bg },
                    headerTintColor: t.fg,
                    headerTitleStyle: { color: t.fg },
                    contentStyle: { backgroundColor: t.bg },
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
            </AppLockGate>
          </SplashGate>
        </Providers>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
