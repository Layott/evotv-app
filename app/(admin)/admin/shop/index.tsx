import { Stack } from "expo-router";
import { ShopManagerPage } from "@/components/admin/shop-manager-page";

export default function AdminShopScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Shop" }} />
      <ShopManagerPage />
    </>
  );
}
