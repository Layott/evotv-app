import { Stack } from "expo-router";

import { OrdersPage } from "@/components/admin/orders-page";

export default function AdminOrdersScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Orders" }} />
      <OrdersPage />
    </>
  );
}
