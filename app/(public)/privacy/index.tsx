import { Stack } from "expo-router";
import { LegalDoc } from "@/components/common/legal-doc";
import { PRIVACY_BODY } from "@/lib/legal/privacy";

/**
 * Public privacy policy shim — same body as the authed
 * `/settings/privacy` screen. Required by Play / App Store / Apple as a
 * publicly-resolvable URL (https://evotv-app.vercel.app/privacy).
 */
export default function PublicPrivacyScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Privacy Policy" }} />
      <LegalDoc title="Privacy Policy" body={PRIVACY_BODY} />
    </>
  );
}
