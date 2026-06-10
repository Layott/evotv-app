import type { MaturityRating } from "@/lib/types";
import { MATURITY_ORDER } from "@/lib/types";

/**
 * True when content at `rating` is allowed for a viewer whose max-allowed level
 * is `pref`. Unrated content is treated as "teen" so it hides under kids/pg and
 * shows for teen/mature.
 */
export function isWithinMaturity(
  rating: MaturityRating | undefined,
  pref: MaturityRating,
): boolean {
  const r = rating ?? "teen"; // unrated hides under kids/pg, shows for teen/mature
  return MATURITY_ORDER[r] <= MATURITY_ORDER[pref];
}

/** Filter a list of content rows down to those within the viewer's max level. */
export function filterByMaturity<T extends { maturityRating?: MaturityRating }>(
  items: T[],
  pref: MaturityRating,
): T[] {
  return items.filter((it) => isWithinMaturity(it.maturityRating, pref));
}
