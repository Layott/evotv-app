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
