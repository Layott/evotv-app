import { Stack } from "expo-router";
import { WaitlistPage } from "@/components/admin/waitlist-page";

export default function AdminWaitlistScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Waitlist" }} />
      <WaitlistPage />
    </>
  );
}
