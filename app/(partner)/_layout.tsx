import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/components/providers";

export default function PartnerLayout() {
  const { isAuthenticated, isLoading, publisherMemberships } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  if (publisherMemberships.length === 0) return <Redirect href="/(public)/home" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#05191B" },
        headerTintColor: "#EAF6F5",
        headerTitleStyle: { color: "#EAF6F5", fontWeight: "700" },
        contentStyle: { backgroundColor: "#05191B" },
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
      <Stack.Screen
        name="channels/[id]/analytics/index"
        options={{ title: "Analytics" }}
      />
      <Stack.Screen
        name="payouts/index"
        options={{ title: "Payouts" }}
      />
    </Stack>
  );
}
