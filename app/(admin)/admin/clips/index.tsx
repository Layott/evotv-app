import { Stack } from "expo-router";
import { ClipsManagerPage } from "@/components/admin/clips-manager-page";

export default function AdminClipsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Clips" }} />
      <ClipsManagerPage />
    </>
  );
}
