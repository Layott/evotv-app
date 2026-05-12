import * as React from "react";

/**
 * Geist font loader — disabled until real .ttf assets land.
 *
 * Drop these files into EVOTV-app/assets/fonts/ then restore the `useFonts`
 * call below:
 *   - Geist-Regular.ttf
 *   - Geist-Medium.ttf
 *   - Geist-SemiBold.ttf
 *   - Geist-Bold.ttf
 *   - GeistMono-Regular.ttf
 * Source: https://github.com/vercel/geist-font
 *
 * Why the short-circuit: `require()`-ing a missing asset returns a null id;
 * `useFonts({Key: null})` then never resolves, blocking SplashGate forever
 * and rendering a white screen on device. Wrapping the hook in try/catch
 * violates Rules of Hooks. Easier to skip the hook entirely and accept
 * the system-font fallback until fonts are bundled.
 */

interface FontLoaderState {
  loaded: boolean;
  error: Error | null;
}

export function useGeistFonts(): FontLoaderState {
  return { loaded: true, error: null };
}

interface FontLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FontLoader({ children }: FontLoaderProps) {
  return <>{children}</>;
}
