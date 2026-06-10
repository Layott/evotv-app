import { useQuery } from "@tanstack/react-query";

import type { MaturityRating } from "@/lib/types";
import { getMyPrefs } from "@/lib/api/prefs";

/**
 * The viewer's max-allowed maturity level. Reads stored prefs (cached under
 * ["me","prefs"]) and falls back to "mature" when prefs are unavailable, so
 * unauthenticated or offline viewers see the full catalog.
 */
export function useMaturityPreference(): MaturityRating {
  const { data } = useQuery({
    queryKey: ["me", "prefs"],
    queryFn: getMyPrefs,
    staleTime: 60_000,
  });
  return data?.maturityPreference ?? "mature";
}
