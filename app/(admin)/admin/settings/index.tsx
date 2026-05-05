import { Stack } from "expo-router";

import { AdminSettingsPage } from "@/components/admin/admin-settings-page";

export default function AdminSettingsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Settings" }} />
      <AdminSettingsPage />
    </>
  );
}
