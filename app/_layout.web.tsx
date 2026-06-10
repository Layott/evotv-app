import "../global.css";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Providers } from "@/components/providers";
import { SplashGate } from "@/components/providers/splash-gate";
import { ErrorBoundary } from "@/components/providers/error-boundary";
import { Landing } from "@/components/web/landing";

/**
 * WEB-ONLY root layout. The website is a marketing + waitlist landing ONLY —
 * the app experience (home/discover/watch/admin) is NOT browsable on the web;
 * it lives in the native app. Metro resolves this `.web.tsx` over the native
 * `_layout.tsx` on the web target, so every web URL renders the Landing and no
 * app route is mounted. Native is untouched.
 */
export default function WebRootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <Providers>
            <SplashGate>
              <StatusBar style="light" />
              <Landing />
            </SplashGate>
          </Providers>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
