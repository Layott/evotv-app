import { Stack, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { ChevronLeft, Sparkles } from "lucide-react-native";

/**
 * MVP gate. Renders a branded "Coming soon" placeholder for features that are
 * built but intentionally hidden for the MVP launch (engagement, social,
 * commerce, creator, dev tools). The route stays alive — flip a screen back to
 * its real body to un-gate. Replaces any mock-data screen so users never see
 * placeholder/fake data.
 */
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
      <View className="h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10">
        <Sparkles size={28} color="#2CD7E3" />
      </View>
      <Text className="mt-5 text-center text-2xl font-bold text-foreground">
        {title}
      </Text>
      <Text className="mt-1 text-center text-[11px] font-semibold uppercase tracking-[3px] text-cyan-400">
        Coming soon
      </Text>
      <Text className="mt-3 max-w-[300px] text-center text-sm text-muted-foreground">
        {blurb ??
          "We're putting the finishing touches on this. It'll land in an upcoming update."}
      </Text>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/(public)/home"))}
        className="mt-7 flex-row items-center gap-1 rounded-full border border-border bg-card px-4 py-2"
      >
        <ChevronLeft size={16} color="#A3A3A3" />
        <Text className="text-sm text-foreground">Back</Text>
      </Pressable>
    </View>
  );
}
