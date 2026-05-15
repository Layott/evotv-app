import { Stack } from "expo-router";
import { LegalDoc } from "@/components/common/legal-doc";
import { PRIVACY_BODY } from "@/lib/legal/privacy";

export default function PrivacyScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Privacy Policy" }} />
      <LegalDoc title="Privacy Policy" body={PRIVACY_BODY} />
    </>
  );
}
