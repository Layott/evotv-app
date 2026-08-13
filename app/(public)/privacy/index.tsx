import { Stack } from "expo-router";
import { LegalDoc } from "@/components/common/legal-doc";
import { PRIVACY_BODY } from "@/lib/legal/privacy";

/**
 * Public privacy policy shim - same body as the authed
 * `/settings/privacy` screen. Required by Play / App Store / Apple as a
 * publicly-resolvable URL: https://evotv.co/privacy.
 *
 * The Vercel host this used to name answers 404 and has done since the move to
 * DigitalOcean. A store listing pointing at it would fail review.
 */
export default function PublicPrivacyScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Privacy Policy" }} />
      <LegalDoc title="Privacy Policy" body={PRIVACY_BODY} />
    </>
  );
}
