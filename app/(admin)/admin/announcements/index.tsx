import { Stack } from "expo-router";
import { AnnouncementsPage } from "@/components/admin/announcements-page";

export default function AdminAnnouncementsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Announcements" }} />
      <AnnouncementsPage />
    </>
  );
}
