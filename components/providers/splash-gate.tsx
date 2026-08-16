import * as React from "react";
import { Image, Text, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";

import { useGeistFonts } from "./font-loader";
import { useAuth } from "./auth-provider";

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash already hidden - safe to ignore.
});

/**
 * Splash gate. Pure setInterval-driven animation - re-renders the view with
 * new transform/opacity values every frame. Bypasses RN's `Animated` +
 * Reanimated entirely after both reportedly didn't visibly animate on the
 * user's APK build #11. Slightly higher CPU than driver-backed animation but
 * unconditionally runs.
 *
 * The animation is "emerge" (owner's pick, 2026-08-16): the mark resolves out
 * of its own light, overbright and slightly large, sharpening as the glow
 * falls back. It replaces two rings that expanded out of the logo on a loop.
 * A ring travelling away from the mark reads as a signal leaving; light coming
 * off the mark reads as the thing itself arriving.
 *
 * The glow is an image (`assets/splash-glow.png`, a baked radial) because RN
 * has neither CSS filters nor radial gradients, and a glow with a hard edge is
 * worse than no glow. Everything else is scale and opacity, which are the two
 * things that behave identically on both platforms.
 */

const GLOW = require("@/assets/splash-glow.png");
const MARK = require("@/assets/icon.png");

/** One frame every 32ms, so ~30fps. Smooth enough for scale and opacity. */
const FRAME_MS = 32;
const EMERGE_MS = 1500;
const GLOW_MS = 1800;

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

interface SplashGateProps {
  children: React.ReactNode;
}

function EmergingHero() {
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    const startedAt = Date.now();
    const t = setInterval(() => {
      // Wall clock rather than a frame counter: a dropped frame then costs
      // smoothness instead of pushing the whole sequence later.
      setElapsed(Date.now() - startedAt);
    }, FRAME_MS);
    return () => clearInterval(t);
  }, []);

  const markT = easeOutExpo(clamp01(elapsed / EMERGE_MS));
  const glowT = easeOutCubic(clamp01(elapsed / GLOW_MS));

  const markScale = 0.86 + 0.14 * markT;
  const markOpacity = clamp01(elapsed / 620);

  // The whitened copy over the mark is what stands in for "overbright": it
  // starts almost opaque and slightly larger, and burns off as the real mark
  // sharpens underneath. RN cannot blur a view, and this reads as the same
  // moment.
  const bloomT = clamp01(elapsed / 1100);
  const bloomOpacity = 0.75 * (1 - easeOutCubic(bloomT));
  const bloomScale = 1.08 - 0.08 * easeOutCubic(bloomT);

  // After the settle the glow keeps a very slow breath. It is barely visible
  // and it is not decoration: without it a slow sign-in leaves a frozen
  // screen, which reads as a hung app rather than a loading one.
  const settled = elapsed > GLOW_MS;
  const breath = settled
    ? 0.04 * (0.5 - 0.5 * Math.cos(((elapsed - GLOW_MS) / 2600) * Math.PI * 2))
    : 0;

  const glowScale = 0.6 + 0.45 * glowT;
  const glowOpacity = 0.85 - 0.55 * glowT + breath;

  return (
    <View
      style={{
        width: 320,
        height: 320,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image
        source={GLOW}
        style={{
          position: "absolute",
          width: 320,
          height: 320,
          opacity: glowOpacity,
          transform: [{ scale: glowScale }],
        }}
        resizeMode="contain"
      />
      <View style={{ width: 128, height: 128 }}>
        <Image
          source={MARK}
          style={{
            width: 128,
            height: 128,
            opacity: markOpacity,
            transform: [{ scale: markScale }],
          }}
          resizeMode="contain"
        />
        <Image
          source={MARK}
          style={{
            position: "absolute",
            width: 128,
            height: 128,
            tintColor: "#EAF6F5",
            opacity: bloomOpacity,
            transform: [{ scale: bloomScale }],
          }}
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
        backgroundColor: "#05191B",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <EmergingHero />
      {/* No wordmark under the logo. The mark says EVO TV, and "Powered by EVO
          TV" is on the same screen: three of the same name is two too many. */}
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
    <View style={{ flex: 1, backgroundColor: "#05191B", opacity }}>
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
