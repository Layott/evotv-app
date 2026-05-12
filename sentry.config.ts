import * as Sentry from "@sentry/react-native";

/**
 * Init Sentry once at app entry. Wired from app/_layout.tsx.
 *
 * Set EXPO_PUBLIC_SENTRY_DSN on EAS preview / production profiles in
 * eas.json. Without a DSN this no-ops (dev / unconfigured).
 */
const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  if (!DSN) return;
  Sentry.init({
    dsn: DSN,
    tracesSampleRate: 0.1,
    enableNativeFramesTracking: true,
    environment: process.env.NODE_ENV ?? "development",
  });
  initialized = true;
}

export { Sentry };
