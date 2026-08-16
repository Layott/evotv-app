import { BASE_URL } from "./api/_client";

/**
 * Prices in the viewer's own money, on the phone.
 *
 * The device knows where its owner is far better than an IP address does: it is
 * what the person set, it survives a VPN, and it is right while roaming. So the
 * app tells the server its region rather than letting the edge guess, which
 * also means this works whether or not `api.evotv.co` sits behind a CDN.
 *
 * Deliberately no new native dependency. `expo-localization` would be the tidy
 * way to read the region and it is a native module, which means a new build and
 * no over-the-air update. `Intl` is already in the JS runtime, so this ships in
 * an OTA like any other bug fix.
 *
 * The charge is still taken in naira, so every converted figure is marked as
 * approximate. A converted price shown as exact is a promise checkout cannot
 * keep.
 */

export interface FxRate {
  base: string;
  currency: string;
  rate: number;
  isBase: boolean;
}

/**
 * The device's two-letter region, or null when the runtime cannot say.
 *
 * Hermes ships Intl on both platforms in SDK 52, but a locale without a region
 * ("en") is common and useless here, so that reads as unknown rather than being
 * forced into a country.
 */
export function deviceRegion(): string | null {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const region = locale?.split("-").find((part) => /^[A-Z]{2}$/.test(part));
    return region ?? null;
  } catch {
    return null;
  }
}

let inflight: Promise<FxRate | null> | null = null;

export function getFxRate(): Promise<FxRate | null> {
  if (!inflight) {
    const region = deviceRegion();
    const url = `${BASE_URL}/api/fx${region ? `?country=${region}` : ""}`;
    inflight = fetch(url)
      .then((r) => (r.ok ? (r.json() as Promise<FxRate>) : null))
      .catch(() => null);
  }
  return inflight;
}

export function formatNgn(ngn: number): string {
  // Not Intl.NumberFormat: a runtime without full currency data renders "NGN"
  // rather than the symbol, and the naira sign is the one every viewer here
  // reads without thinking.
  return `₦${Math.round(ngn).toLocaleString("en-NG")}`;
}

/**
 * A naira amount, converted for display, with the real price kept alongside.
 *
 * Returns naira alone whenever conversion is not happening or not possible, so
 * a caller never has to decide what to do with a missing rate.
 */
export function formatPrice(ngn: number, fx: FxRate | null): string {
  const naira = formatNgn(ngn);
  if (!fx || fx.isBase || fx.currency === fx.base || !Number.isFinite(fx.rate)) {
    return naira;
  }
  const converted = ngn * fx.rate;
  let shown: string;
  try {
    shown = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: fx.currency,
      maximumFractionDigits: converted < 100 ? 2 : 0,
    }).format(converted);
  } catch {
    shown = `${fx.currency} ${converted.toFixed(converted < 100 ? 2 : 0)}`;
  }
  return `≈ ${shown} (${naira})`;
}
