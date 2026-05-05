import { Stack } from "expo-router";

import { OverviewPage } from "@/components/admin/overview-page";

export default function AdminOverviewScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Admin overview" }} />
      <OverviewPage />
    </>
  );
}
