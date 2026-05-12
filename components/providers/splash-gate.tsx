import * as React from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Text,
  View,
} from "react-native";
import * as SplashScreen from "expo-splash-screen";

import { useGeistFonts } from "./font-loader";
import { useAuth } from "./auth-provider";

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash already hidden — safe to ignore.
});

/**
 * Splash gate. Renders an obviously-animated splash for at least 1.8s, then
 * fades the rendered app tree in. Animations use the classic RN `Animated`
 * API (not Reanimated) because `react-native-worklets` had to be removed
 * for RN 0.76 compatibility, and without worklets Reanimated silently
 * no-ops on native.
 *
 * Simplified layout (one pulsing centered logo + ring + spinner + label)
 * after the earlier multi-ring version reportedly showed only the static
 * logo on device — too much absolute-positioned overlap was masking the
 * animation. This version is brain-dead simple and provably runs.
 */

const CYAN = "#2CD7E3";

interface SplashGateProps {
  children: React.ReactNode;
}

function PulsingHero() {
  const scale = React.useRef(new Animated.Value(1)).current;
  const ringScale = React.useRef(new Animated.Value(0.9)).current;
  const ringOpacity = React.useRef(new Animated.Value(0.55)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.08,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    const ring = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ringScale, {
            toValue: 1.35,
            duration: 1800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ringScale, {
            toValue: 0.9,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 1800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0.55,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    ring.start();

    return () => {
      pulse.stop();
      ring.stop();
    };
  }, [scale, ringScale, ringOpacity]);

  return (
    <View
      style={{
        width: 220,
        height: 220,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 220,
          height: 220,
          borderRadius: 110,
          borderWidth: 2,
          borderColor: CYAN,
          opacity: ringOpacity,
          transform: [{ scale: ringScale }],
        }}
      />
      <Animated.View style={{ transform: [{ scale }] }}>
        <Image
          source={require("@/assets/icon.png")}
          style={{ width: 128, height: 128, borderRadius: 28 }}
          resizeMode="contain"
        />
      </Animated.View>
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
      <View style={{ marginTop: 16 }}>
        <ActivityIndicator size="small" color={CYAN} />
      </View>
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
  const fade = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fade]);

  return (
    <Animated.View style={{ flex: 1, backgroundColor: "#0A0A0A", opacity: fade }}>
      {children}
    </Animated.View>
  );
}

export function SplashGate({ children }: SplashGateProps) {
  const { loaded: fontsLoaded, error: fontError } = useGeistFonts();
  const { isLoading: authLoading } = useAuth();
  const ready = (fontsLoaded || fontError !== null) && !authLoading;
  const [minDelayElapsed, setMinDelayElapsed] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setMinDelayElapsed(true), 1800);
    return () => clearTimeout(t);
  }, []);

  const showSplash = !ready || !minDelayElapsed;

  React.useEffect(() => {
    if (showSplash) return;
    void SplashScreen.hideAsync().catch(() => {
      // Already hidden.
    });
  }, [showSplash]);

  if (showSplash) return <SplashScreenView />;
  return <FadingChildren>{children}</FadingChildren>;
}
