import { Stack } from "expo-router";

import { ContentManagerPage } from "@/components/admin/content-manager-page";

export default function AdminContentScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Content" }} />
      <ContentManagerPage />
    </>
  );
}
