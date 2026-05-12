import * as React from "react";
import { Image, Text, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { useGeistFonts } from "./font-loader";
import { useAuth } from "./auth-provider";

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash already hidden — safe to ignore.
});

const CYAN = "#2CD7E3";
const BLUE = "#16CFF3";

interface SplashGateProps {
  children: React.ReactNode;
}

function ExpandingRing({ delay, color }: { delay: number; color: string }) {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 3000, easing: Easing.out(Easing.cubic) }),
        -1,
        false,
      ),
    );
  }, [progress, delay]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 0.8 + progress.value * 0.7 }],
    opacity: 0.8 * (1 - progress.value),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          width: 256,
          height: 256,
          borderRadius: 128,
          borderWidth: 2,
          borderColor: color,
        },
        style,
      ]}
    />
  );
}

function GlowRing() {
  const pulse = useSharedValue(0);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const style = useAnimatedStyle(() => ({
    shadowRadius: 40 + pulse.value * 40,
    shadowOpacity: 0.7 + pulse.value * 0.3,
    opacity: 0.55 + pulse.value * 0.25,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          width: 192,
          height: 192,
          borderRadius: 96,
          backgroundColor: "rgba(44, 215, 227, 0.18)",
          borderWidth: 1,
          borderColor: "rgba(44, 215, 227, 0.55)",
          shadowColor: CYAN,
          shadowOffset: { width: 0, height: 0 },
          elevation: 18,
        },
        style,
      ]}
    />
  );
}

function RotatingArc() {
  const angle = useSharedValue(0);

  React.useEffect(() => {
    angle.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [angle]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${angle.value}deg` }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          width: 160,
          height: 160,
          borderRadius: 80,
          borderWidth: 2,
          borderColor: "transparent",
          borderTopColor: CYAN,
          borderRightColor: "rgba(44, 215, 227, 0.35)",
          opacity: 0.7,
        },
        style,
      ]}
    />
  );
}

function PulseLogo() {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ zIndex: 10 }, style]}>
      <Image
        source={require("@/assets/icon.png")}
        style={{ width: 144, height: 144, borderRadius: 32 }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

function PoweredBy() {
  const fade = useSharedValue(0.5);

  React.useEffect(() => {
    fade.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.5, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [fade]);

  const style = useAnimatedStyle(() => ({
    opacity: fade.value,
  }));

  return (
    <Animated.Text
      style={[
        {
          marginTop: 40,
          color: "#666666",
          fontSize: 13,
          fontWeight: "300",
          letterSpacing: 1,
        },
        style,
      ]}
    >
      Powered by EVO TV
    </Animated.Text>
  );
}

function SplashScreenView() {
  return (
    <Animated.View
      exiting={FadeOut.duration(300).easing(Easing.out(Easing.cubic))}
      style={{
        flex: 1,
        backgroundColor: "#000000",
        alignItems: "center",
        justifyContent: "center",
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

  return (
    <Animated.View
      entering={FadeIn.duration(420).easing(Easing.out(Easing.cubic))}
      style={{ flex: 1, backgroundColor: "#0A0A0A" }}
    >
      {children}
    </Animated.View>
  );
}
