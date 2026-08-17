import { Stack } from "expo-router";
import { SubscriptionsPage } from "@/components/admin/subscriptions-page";

export default function AdminSubscriptionsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Subscriptions" }} />
      <SubscriptionsPage />
    </>
  );
}
