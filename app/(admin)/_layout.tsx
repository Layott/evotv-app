import { Redirect, Stack } from "expo-router";
import { useTokens } from "@/lib/theme/tokens";

import { useAuth } from "@/components/providers";
import { hasMinRole } from "@/lib/auth/roles";

export default function AdminLayout() {
  const t = useTokens();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // On the ladder, not `role !== "admin"`. That comparison is true for a
  // head_admin, so the highest role on the platform was bounced out of the
  // admin section entirely. Found by signing in as one and watching the app
  // redirect to home.
  if (!hasMinRole(user.role, "admin")) {
    return <Redirect href="/" />;
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
