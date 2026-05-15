import { Stack } from "expo-router";
import { VodsManagerPage } from "@/components/admin/vods-manager-page";

export default function AdminVodsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "VODs" }} />
      <VodsManagerPage />
    </>
  );
}
