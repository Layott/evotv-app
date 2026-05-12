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
 * Splash gate — wraps the entire app while fonts + auth hydrate.
 *
 * Animations use the classic RN `Animated` API (NOT Reanimated). Reanimated
 * needs `react-native-worklets` which is incompatible with RN 0.76, and
 * without worklets `useSharedValue` + `withRepeat` no-op on native. Vanilla
 * `Animated.loop` runs reliably on both platforms.
 */

const CYAN = "#2CD7E3";
const BLUE = "#16CFF3";

interface SplashGateProps {
  children: React.ReactNode;
}

function ExpandingRing({ delay, color }: { delay: number; color: string }) {
  const progress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: 3000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [progress, delay]);

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.5],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: 256,
        height: 256,
        borderRadius: 128,
        borderWidth: 2,
        borderColor: color,
        transform: [{ scale }],
        opacity,
      }}
    />
  );
}

function GlowRing() {
  const pulse = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const shadowRadius = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 80],
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0.8],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: 192,
        height: 192,
        borderRadius: 96,
        backgroundColor: "rgba(44, 215, 227, 0.18)",
        borderWidth: 1,
        borderColor: "rgba(44, 215, 227, 0.55)",
        shadowColor: CYAN,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.85,
        shadowRadius,
        elevation: 18,
        opacity,
      }}
    />
  );
}

function RotatingArc() {
  const angle = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(angle, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [angle]);

  const rotate = angle.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 2,
        borderColor: "transparent",
        borderTopColor: CYAN,
        borderRightColor: "rgba(44, 215, 227, 0.35)",
        opacity: 0.7,
        transform: [{ rotate }],
      }}
    />
  );
}

function PulseLogo() {
  const scale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);

  return (
    <Animated.View style={{ zIndex: 10, transform: [{ scale }] }}>
      <Image
        source={require("@/assets/icon.png")}
        style={{ width: 144, height: 144, borderRadius: 32 }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

function PoweredBy() {
  const fade = React.useRef(new Animated.Value(0.5)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(fade, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 0.5,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [fade]);

  return (
    <Animated.Text
      style={{
        marginTop: 40,
        color: "#999999",
        fontSize: 13,
        fontWeight: "300",
        letterSpacing: 1,
        opacity: fade,
      }}
    >
      Powered by EVO TV
    </Animated.Text>
  );
}

function SplashScreenView({ leaving }: { leaving: boolean }) {
  const fade = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (!leaving) return;
    Animated.timing(fade, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [leaving, fade]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        flex: 1,
        backgroundColor: "#000000",
        alignItems: "center",
        justifyContent: "center",
        opacity: fade,
      }}
    >
      <View
        style={{
          width: 256,
          height: 256,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ExpandingRing delay={0} color={CYAN} />
        <ExpandingRing delay={1000} color={BLUE} />
        <GlowRing />
        <RotatingArc />
        <PulseLogo />
      </View>
      <PoweredBy />
      {/* Tiny system spinner as last-resort visual feedback in case all
          the Animated.loop calls fail silently (e.g. headless web SSR). */}
      <View style={{ marginTop: 12, opacity: 0.0 }}>
        <ActivityIndicator size="small" color={CYAN} />
      </View>
    </Animated.View>
  );
}

function FadingChildren({ children }: { children: React.ReactNode }) {
  const fade = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 420,
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

  if (showSplash) return <SplashScreenView leaving={false} />;
  return <FadingChildren>{children}</FadingChildren>;
}
