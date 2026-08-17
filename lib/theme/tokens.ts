import { useColorScheme } from "nativewind";

/**
 * The palette in JavaScript, for the places Tailwind classes cannot reach.
 *
 * Most of the app is styled with classes, and those follow the appearance
 * setting on their own now that `tailwind.config.js` reads CSS variables. Two
 * things cannot:
 *
 * - `lucide-react-native` icons, which take a `color` string, not a class.
 * - navigator chrome (`Stack` / `Tabs` `screenOptions`), which takes style
 *   objects.
 *
 * So the same palette is mirrored here. `global.css`, `tailwind.config.js` and
 * this file all describe one palette and must agree.
 */

export interface ThemeTokens {
  brand: string;
  /** The brand at 20%, for a fill sitting under brand-coloured type. */
  brandDim: string;
  bg: string;
  /** One step off the page, for cards and rows. */
  surface: string;
  fg: string;
  muted: string;
  /** Hairline borders are banned product-wide; this stays transparent. */
  border: string;
  /** Form fields keep an edge, which is the one exception to the ban. */
  input: string;
  danger: string;
}

const dark: ThemeTokens = {
  brand: "#46E3CE",
  brandDim: "rgba(70, 227, 206, 0.2)",
  bg: "#05191B",
  surface: "#0A2426",
  fg: "#EAF6F5",
  muted: "#9FBDBD",
  border: "transparent",
  input: "#17454A",
  danger: "#FF4A38",
};

const light: ThemeTokens = {
  // Full-strength mint is unreadable on a light ground, so anything that
  // carries text darkens. Built to the same relationships as dark rather than
  // inverted from it.
  brand: "#0C7A6E",
  brandDim: "rgba(12, 122, 110, 0.14)",
  // Off-white, never #fff on the page itself, so a white card still reads as
  // raised without a stroke around it.
  bg: "#F4F7F6",
  surface: "#FFFFFF",
  fg: "#082224",
  muted: "#526E6E",
  border: "transparent",
  input: "#D6E9E6",
  danger: "#C81E1E",
};

export const THEME_TOKENS = { light, dark } as const;

/**
 * Dark, as a plain object, for module-scope constants that cannot call a hook.
 *
 * Prefer `useTokens()` in anything that renders. This export exists so the
 * handful of files holding colours in top-level constants keep compiling; each
 * one is a place the light theme does not reach yet.
 */
export const tokens = dark;

export function useTokens(): ThemeTokens {
  const { colorScheme } = useColorScheme();
  return colorScheme === "light" ? light : dark;
}
