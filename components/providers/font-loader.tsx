import * as React from "react";
import { useFonts } from "expo-font";
import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
} from "@expo-google-fonts/archivo";
import { MartianMono_400Regular } from "@expo-google-fonts/martian-mono";

/**
 * The app's typefaces, loaded for real.
 *
 * Until now this file was a stub: it returned `{loaded: true}` and no font was
 * ever bundled, so every screen has been running the system face while
 * `tailwind.config.js` claimed Geist and two navigators asked for
 * "GeistSemiBold". Nothing was broken because nothing was ever there.
 *
 * Geist is banned outright by the no-vibecoded-look rule. Archivo replaces it
 * on both platforms, matching the website.
 *
 * ## Why five keys instead of one family
 *
 * React Native does not synthesise weights. On Android especially, a single
 * registered family plus `fontWeight: "600"` gives you the regular face and no
 * error. Each weight has to be its own registered family, which is why the
 * keys read `ArchivoSemiBold` rather than `Archivo` at weight 600.
 *
 * The 529 existing `font-medium` / `font-semibold` / `font-bold` classes did
 * not have to change for this: `global.css` maps those three utilities onto
 * these family names, so a weight class picks the right file.
 *
 * ## Why the display faces are local .ttf files
 *
 * The website sets headings in Archivo at `wdth` 118, which is the broadcast
 * move the family was chosen for. `@expo-google-fonts/archivo` ships weights
 * only, no width instances, and React Native cannot reach a variable font's
 * axes. So the two display faces are instanced statics pulled from Google's
 * own CSS endpoint at exactly `wdth` 118, and their internal family name reads
 * "Archivo SemiExpanded". Same width as the web, byte for byte the same
 * outlines.
 *
 * ## Why this must not return early
 *
 * `require()` on a missing asset returns a null id, and `useFonts({K: null})`
 * never resolves, which blocks SplashGate forever and shows a white screen on
 * device. That is why this was a stub in the first place. The two local files
 * are committed to the repo, so the require cannot come back null - but if a
 * future font is added and forgotten, this is the failure to expect.
 */

interface FontLoaderState {
  loaded: boolean;
  error: Error | null;
}

export function useAppFonts(): FontLoaderState {
  const [loaded, error] = useFonts({
    Archivo: Archivo_400Regular,
    ArchivoMedium: Archivo_500Medium,
    ArchivoSemiBold: Archivo_600SemiBold,
    ArchivoBold: Archivo_700Bold,
    ArchivoDisplay: require("../../assets/fonts/Archivo-DisplayBold.ttf"),
    ArchivoDisplayHeavy: require("../../assets/fonts/Archivo-DisplayExtraBold.ttf"),
    MartianMono: MartianMono_400Regular,
  });

  return { loaded, error };
}

/**
 * Kept as an alias so the rename does not have to ripple through SplashGate in
 * the same change. New code should call `useAppFonts`.
 */
export const useGeistFonts = useAppFonts;

interface FontLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FontLoader({ children }: FontLoaderProps) {
  return <>{children}</>;
}
