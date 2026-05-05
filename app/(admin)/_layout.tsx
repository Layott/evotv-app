import { Redirect, Stack } from "expo-router";

import { useMockAuth } from "@/components/providers";

export default function AdminLayout() {
  const { user, isLoading } = useMockAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user.role !== "admin") {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0A0A0A" },
        headerTintColor: "#FAFAFA",
        headerTitleStyle: { color: "#FAFAFA", fontFamily: "GeistSemiBold" },
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: "#0A0A0A" },
        animation: "slide_from_right",
      }}
    />
  );
}
