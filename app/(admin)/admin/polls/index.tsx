import { Stack } from "expo-router";

import { PollsManagerPage } from "@/components/admin/polls-manager-page";

export default function AdminPollsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Polls" }} />
      <PollsManagerPage />
    </>
  );
}
