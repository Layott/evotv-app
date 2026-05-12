import * as React from "react";
import { Image, Text, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";

import { useGeistFonts } from "./font-loader";
import { useAuth } from "./auth-provider";

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash already hidden — safe to ignore.
});

/**
 * Splash gate. Pure setInterval-driven animation — re-renders the view
 * with new transform/opacity values every 60ms. Bypasses RN's `Animated`
 * + Reanimated entirely after both reportedly didn't visibly animate on
 * the user's APK build #11. Slightly higher CPU than driver-backed
 * animation but unconditionally runs.
 *
 * Loops until min delay + auth-load complete, then fades children in.
 */

const CYAN = "#2CD7E3";

interface SplashGateProps {
  children: React.ReactNode;
}

function PulsingHero() {
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const t = setInterval(() => {
      setTick((prev) => (prev + 1) % 600);
    }, 50);
    return () => clearInterval(t);
  }, []);

  // tick goes 0 → 599 then resets. 30s cycle (600 * 50ms).
  // We use phase positions to derive multiple parallel animations.
  const t = tick;
  const TWO_PI = Math.PI * 2;

  // Logo pulse 1.0 → 1.08 with sine wave, 1.8s cycle = 36 ticks.
  const pulsePhase = (t % 36) / 36;
  const logoScale = 1 + 0.08 * (0.5 - 0.5 * Math.cos(pulsePhase * TWO_PI));

  // Ring expand 0.9 → 1.4 over 1.8s, then snap. Linear.
  const ringPhase = (t % 36) / 36;
  const ringScale = 0.9 + 0.55 * ringPhase;
  const ringOpacity = 0.65 * (1 - ringPhase);

  // Second ring offset 18 ticks (half cycle).
  const ring2Phase = ((t + 18) % 36) / 36;
  const ring2Scale = 0.9 + 0.55 * ring2Phase;
  const ring2Opacity = 0.5 * (1 - ring2Phase);

  return (
    <View
      style={{
        width: 240,
        height: 240,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 240,
          height: 240,
          borderRadius: 120,
          borderWidth: 2,
          borderColor: CYAN,
          opacity: ringOpacity,
          transform: [{ scale: ringScale }],
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 240,
          height: 240,
          borderRadius: 120,
          borderWidth: 2,
          borderColor: "#16CFF3",
          opacity: ring2Opacity,
          transform: [{ scale: ring2Scale }],
        }}
      />
      <View style={{ transform: [{ scale: logoScale }] }}>
        <Image
          source={require("@/assets/icon.png")}
          style={{ width: 128, height: 128, borderRadius: 28 }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

function SplashScreenView() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000000",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <PulsingHero />
      <Text
        style={{
          marginTop: 32,
          color: "#FAFAFA",
          fontSize: 16,
          fontWeight: "700",
          letterSpacing: 4,
        }}
      >
        EVO TV
      </Text>
      <Text
        style={{
          position: "absolute",
          bottom: 48,
          color: "#666666",
          fontSize: 11,
          fontWeight: "300",
          letterSpacing: 1.5,
        }}
      >
        Powered by EVO TV
      </Text>
    </View>
  );
}

function FadingChildren({ children }: { children: React.ReactNode }) {
  const [opacity, setOpacity] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    let t = 0;
    const interval = setInterval(() => {
      if (cancelled) return;
      t += 50;
      const next = Math.min(1, t / 360);
      setOpacity(next);
      if (next >= 1) clearInterval(interval);
    }, 50);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A", opacity }}>
      {children}
    </View>
  );
}

export function SplashGate({ children }: SplashGateProps) {
  const { loaded: fontsLoaded, error: fontError } = useGeistFonts();
  const { isLoading: authLoading } = useAuth();
  const ready = (fontsLoaded || fontError !== null) && !authLoading;
  const [minDelayElapsed, setMinDelayElapsed] = React.useState(false);

  // Hide the native expo-splash-screen.png IMMEDIATELY so our animated
  // React splash is visible. If we wait until `showSplash` flips false,
  // the native splash sits on top of our animation the entire time.
  React.useEffect(() => {
    void SplashScreen.hideAsync().catch(() => {
      // Already hidden.
    });
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => setMinDelayElapsed(true), 2400);
    return () => clearTimeout(t);
  }, []);

  const showSplash = !ready || !minDelayElapsed;

  if (showSplash) return <SplashScreenView />;
  return <FadingChildren>{children}</FadingChildren>;
}
