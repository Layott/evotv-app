import { Stack } from "expo-router";

import { ScheduleManagerPage } from "@/components/admin/schedule-manager-page";

export default function AdminScheduleScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Schedule" }} />
      <ScheduleManagerPage />
    </>
  );
}
