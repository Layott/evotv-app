import * as React from "react";
import * as SplashScreen from "expo-splash-screen";
import Animated, { FadeIn } from "react-native-reanimated";

import { useGeistFonts } from "./font-loader";
import { useAuth } from "./auth-provider";

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash already hidden — safe to ignore.
});

interface SplashGateProps {
  children: React.ReactNode;
}

export function SplashGate({ children }: SplashGateProps) {
  const { loaded: fontsLoaded, error: fontError } = useGeistFonts();
  const { isLoading: authLoading } = useAuth();
  const ready = (fontsLoaded || fontError !== null) && !authLoading;

  React.useEffect(() => {
    if (!ready) return;
    void SplashScreen.hideAsync().catch(() => {
      // Already hidden.
    });
  }, [ready]);

  if (!ready) return null;
  return (
    <Animated.View
      entering={FadeIn.duration(380)}
      style={{ flex: 1, backgroundColor: "#0A0A0A" }}
    >
      {children}
    </Animated.View>
  );
}
