import * as React from "react";
import * as SplashScreen from "expo-splash-screen";

import { useGeistFonts } from "./font-loader";
import { useMockAuth } from "./mock-auth-provider";

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash already hidden — safe to ignore.
});

interface SplashGateProps {
  children: React.ReactNode;
}

export function SplashGate({ children }: SplashGateProps) {
  const { loaded: fontsLoaded, error: fontError } = useGeistFonts();
  const { isLoading: authLoading } = useMockAuth();
  const ready = (fontsLoaded || fontError !== null) && !authLoading;

  React.useEffect(() => {
    if (!ready) return;
    void SplashScreen.hideAsync().catch(() => {
      // Already hidden.
    });
  }, [ready]);

  if (!ready) return null;
  return <>{children}</>;
}
