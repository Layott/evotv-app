import { Stack } from "expo-router";

import { StreamsManagerPage } from "@/components/admin/streams-manager-page";

export default function AdminStreamsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Streams" }} />
      <StreamsManagerPage />
    </>
  );
}
