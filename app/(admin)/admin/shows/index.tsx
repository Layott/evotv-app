import { Stack } from "expo-router";
import { ShowsManagerPage } from "@/components/admin/shows-manager-page";

export default function AdminShowsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Shows" }} />
      <ShowsManagerPage />
    </>
  );
}
