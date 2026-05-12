/**
 * Sentry init — DEFERRED dynamic-require so the static import doesn't drag
 * the native module into the JS bundle. Build #11 was shipped before
 * @sentry/react-native landed, so a top-level `import * as Sentry from
 * "@sentry/react-native"` would crash on launch in the field. This file
 * lazily requires the module only when EXPO_PUBLIC_SENTRY_DSN is set AND
 * the native module is available; otherwise it no-ops.
 *
 * Will go back to a static import once an APK build ships with the
 * @sentry/react-native native module bundled.
 */

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  if (!DSN) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require("@sentry/react-native") as typeof import("@sentry/react-native");
    Sentry.init({
      dsn: DSN,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV ?? "development",
    });
    initialized = true;
  } catch {
    // Native module not in this build — silently skip.
  }
}
