import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format an ISO date string with locale options. Returns the fallback (default
 * "—") when the input is null, undefined, empty, or unparseable. Use this for
 * any field that originates from a nullable backend column, including legacy
 * mock fields that the Phase 1A swap may turn into nulls.
 */
export function formatDate(
  iso: string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  fallback = "—",
): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback;
  return options ? d.toLocaleString(undefined, options) : d.toLocaleString();
}

/** Variant of formatDate that returns date-only (no time component). */
export function formatDateOnly(
  iso: string | null | undefined,
  fallback = "—",
): string {
  return formatDate(iso, { year: "numeric", month: "short", day: "numeric" }, fallback);
}
