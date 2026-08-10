import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#05191B" },
        animation: "slide_from_bottom",
      }}
    />
  );
}
