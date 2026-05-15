import { Stack } from "expo-router";
import { LegalDoc } from "@/components/common/legal-doc";
import { TERMS_BODY } from "@/lib/legal/terms";

export default function TermsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Terms of Service" }} />
      <LegalDoc title="Terms of Service" body={TERMS_BODY} />
    </>
  );
}
