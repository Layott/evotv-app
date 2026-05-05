import { Stack } from "expo-router";

import { AdsManagerPage } from "@/components/admin/ads-manager-page";

export default function AdminAdsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Ads" }} />
      <AdsManagerPage />
    </>
  );
}
