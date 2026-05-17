import { Stack } from "expo-router";
import { LegalDoc } from "@/components/common/legal-doc";
import { TERMS_BODY } from "@/lib/legal/terms";

/**
 * Public terms shim — same body as the authed `/settings/terms` screen.
 * Required by Play / App Store as a publicly-resolvable URL
 * (https://evotv-app.vercel.app/terms).
 */
export default function PublicTermsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Terms of Service" }} />
      <LegalDoc title="Terms of Service" body={TERMS_BODY} />
    </>
  );
}
