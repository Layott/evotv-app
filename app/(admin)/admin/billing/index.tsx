import { Stack } from "expo-router";

import { AdminBillingPage } from "@/components/admin/billing-page";

export default function AdminBillingScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Billing & USSD" }} />
      <AdminBillingPage />
    </>
  );
}
