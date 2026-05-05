import { Stack, useLocalSearchParams } from "expo-router";

import { OrderView } from "@/components/shop/order-view";

export default function ProfileOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen options={{ title: "Order" }} />
      <OrderView id={id ?? ""} />
    </>
  );
}
