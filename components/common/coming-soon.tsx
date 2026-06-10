import { Stack, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, ReduceMotion } from "react-native-reanimated";
import { ChevronLeft, Sparkles } from "lucide-react-native";

/**
 * MVP gate. Renders a branded "Coming soon" placeholder for features that are
 * built but intentionally hidden for the MVP launch (engagement, social,
 * commerce, creator, dev tools). The route stays alive - flip a screen back to
 * its real body to un-gate. Replaces any mock-data screen so users never see
 * placeholder/fake data.
 *
 * Entrance: a calm staggered fade-up (no bounce), honoring reduced-motion.
 */
const rm = ReduceMotion.System;
const rise = (delay: number) =>
  FadeInDown.duration(420).delay(delay).reduceMotion(rm);

export function ComingSoon({
  title,
  blurb,
}: {
  title: string;
  blurb?: string;
}) {
  const router = useRouter();
  return (
    <View className="flex-1 items-center justify-center bg-background px-8">
      <Stack.Screen options={{ title }} />
      <Animated.View
        entering={FadeIn.duration(500).reduceMotion(rm)}
        className="h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10"
      >
        <Sparkles size={28} color="#2CD7E3" />
      </Animated.View>
      <Animated.Text
        entering={rise(80)}
        className="mt-5 text-center text-2xl font-bold text-foreground"
      >
        {title}
      </Animated.Text>
      <Animated.Text
        entering={rise(150)}
        className="mt-1 text-center text-[11px] font-semibold uppercase tracking-[3px] text-cyan-400"
      >
        Coming soon
      </Animated.Text>
      <Animated.Text
        entering={rise(220)}
        className="mt-3 max-w-[300px] text-center text-sm text-muted-foreground"
      >
        {blurb ??
          "We're putting the finishing touches on this. It'll land in an upcoming update."}
      </Animated.Text>
      <Animated.View entering={rise(300)}>
        <Pressable
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/(public)/home")
          }
          className="mt-7 flex-row items-center gap-1 rounded-full border border-border bg-card px-4 py-2 active:opacity-70"
        >
          <ChevronLeft size={16} color="#A3A3A3" />
          <Text className="text-sm text-foreground">Back</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
