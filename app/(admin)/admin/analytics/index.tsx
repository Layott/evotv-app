import { Stack } from "expo-router";

import { AnalyticsPage } from "@/components/admin/analytics-page";

export default function AdminAnalyticsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Analytics" }} />
      <AnalyticsPage />
    </>
  );
}
