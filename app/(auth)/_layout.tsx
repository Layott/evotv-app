import { Stack } from "expo-router";
import { useTokens } from "@/lib/theme/tokens";

export default function AuthLayout() {
  const t = useTokens();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: t.bg },
        animation: "slide_from_bottom",
      }}
    />
  );
}
