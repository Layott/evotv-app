import { Stack } from "expo-router";

export default function EmbedLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#05191B" },
        animation: "fade",
      }}
    />
  );
}
