import { Redirect, Stack } from "expo-router";

import { useMockAuth } from "@/components/providers";

export default function PartnerLayout() {
  const { isAuthenticated, isLoading, publisherMemberships } = useMockAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  if (publisherMemberships.length === 0) return <Redirect href="/(public)/home" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0A0A0A" },
        headerTintColor: "#FAFAFA",
        headerTitleStyle: { color: "#FAFAFA", fontWeight: "700" },
        contentStyle: { backgroundColor: "#0A0A0A" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="dashboard/index" options={{ title: "Partner dashboard" }} />
      <Stack.Screen name="channels/index" options={{ title: "Channels" }} />
      <Stack.Screen
        name="channels/[id]/index"
        options={{ title: "Channel" }}
      />
      <Stack.Screen
        name="channels/[id]/stream-key/index"
        options={{ title: "Stream key" }}
      />
    </Stack>
  );
}
