import * as React from "react";
import { useFonts } from "expo-font";

// TODO: drop these font files into EVOTV-app/assets/fonts/ before first run.
//   - Geist-Regular.ttf
//   - Geist-Medium.ttf
//   - Geist-SemiBold.ttf
//   - Geist-Bold.ttf
//   - GeistMono-Regular.ttf
// Source: https://github.com/vercel/geist-font (otf available — convert to ttf
// with fonttools or rename if Expo accepts otf in your asset config).

interface FontLoaderState {
  loaded: boolean;
  error: Error | null;
}

export function useGeistFonts(): FontLoaderState {
  let loaded = false;
  let error: Error | null = null;

  try {
    const [fontsLoaded, fontError] = useFonts({
      Geist: require("../../assets/fonts/Geist-Regular.ttf"),
      GeistMedium: require("../../assets/fonts/Geist-Medium.ttf"),
      GeistSemiBold: require("../../assets/fonts/Geist-SemiBold.ttf"),
      GeistBold: require("../../assets/fonts/Geist-Bold.ttf"),
      GeistMono: require("../../assets/fonts/GeistMono-Regular.ttf"),
    });
    loaded = fontsLoaded;
    error = fontError ?? null;
  } catch (err) {
    // Font assets missing — fall back gracefully so the app still boots.
    error = err instanceof Error ? err : new Error("Failed to load Geist fonts");
    loaded = true;
  }

  return { loaded, error };
}

interface FontLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FontLoader({ children, fallback = null }: FontLoaderProps) {
  const { loaded, error } = useGeistFonts();
  if (!loaded && !error) return <>{fallback}</>;
  return <>{children}</>;
}
