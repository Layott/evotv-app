import { Redirect, Stack } from "expo-router";
import { useTokens } from "@/lib/theme/tokens";

import { useAuth } from "@/components/providers";

export default function AuthedLayout() {
  const t = useTokens();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: t.bg },
        headerTintColor: t.fg,
        headerTitleStyle: { color: t.fg, fontFamily: "ArchivoSemiBold" },
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: t.bg },
        animation: "slide_from_right",
      }}
    />
  );
}
