import { Stack } from "expo-router";

import { ForensicPage } from "@/components/admin/forensic-page";

export default function AdminForensicScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Forensic watermark" }} />
      <ForensicPage />
    </>
  );
}
