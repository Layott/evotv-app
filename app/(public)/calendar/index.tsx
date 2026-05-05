import { Stack } from "expo-router";

import { MatchCalendarPage } from "@/components/calendar/calendar-page";

export default function CalendarScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Match calendar" }} />
      <MatchCalendarPage />
    </>
  );
}
