import { Stack } from "expo-router";

export default function EmbedLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#000000" },
        animation: "fade",
      }}
    />
  );
}
