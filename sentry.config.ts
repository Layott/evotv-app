/**
 * RN Sentry disabled. @sentry/react-native@8.x requires native codegen that
 * conflicts with RN 0.76 + bare worklets removed; build #12 failed gradle on
 * `:sentry-react-native:generateCodegenArtifactsFromSchema`. Revisit with
 * @sentry/react-native@5.x or after RN 0.78+ upgrade.
 *
 * Next.js Sentry (server side) still wired in `../EVOTV/`.
 */

export function initSentry(): void {
  // intentional noop
}
