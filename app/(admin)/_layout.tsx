import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/components/providers";
import { hasMinRole } from "@/lib/auth/roles";

export default function AdminLayout() {
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
        headerStyle: { backgroundColor: "#05191B" },
        headerTintColor: "#EAF6F5",
        headerTitleStyle: { color: "#EAF6F5", fontFamily: "GeistSemiBold" },
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: "#05191B" },
        animation: "slide_from_right",
      }}
    />
  );
}
