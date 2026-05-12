import { Platform } from "react-native";

/**
 * Sentry init — platform-gated. Web build (RN-web on Vercel) skips
 * @sentry/react-native entirely. The web Sentry SDK can be wired later
 * via @sentry/react if needed.
 *
 * Native path uses dynamic require so a missing native module (e.g.
 * the still-installed APK #11) silently no-ops instead of crashing.
 */

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  if (!DSN) return;
  if (Platform.OS === "web") return;

  try {
    // Use bracket-access dynamic require so Metro can't statically
    // analyze the import on the web target. Metro builds for web
    // never visit this branch (Platform.OS === "web" returns early).
    const moduleName = "@sentry/react-native";
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = (require as unknown as (m: string) => typeof import("@sentry/react-native"))(moduleName);
    Sentry.init({
      dsn: DSN,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV ?? "development",
    });
    initialized = true;
  } catch {
    // Native module not bundled in this APK — silently skip.
  }
}
