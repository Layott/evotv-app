import { Redirect, useLocalSearchParams } from "expo-router";

/**
 * Public-facing profile lives at /u/[handle]. This authed-only path was an
 * earlier mock-only duplicate (Phase F draft). Redirect any direct hits so
 * there's a single source of truth for the profile page.
 */
export default function AuthedProfileHandleRedirect() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  if (!handle) return <Redirect href="/" />;
  return <Redirect href={`/u/${handle}` as never} />;
}
