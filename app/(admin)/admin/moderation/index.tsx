import { Stack } from "expo-router";

import { ModerationPage } from "@/components/admin/moderation-page";

export default function AdminModerationScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Moderation" }} />
      <ModerationPage />
    </>
  );
}
