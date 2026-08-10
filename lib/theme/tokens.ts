// Mirrors tailwind.config.js and EVOTV/app/globals.css. All three must agree.
export const tokens = {
  brand: "#46E3CE",
  // rgba of the brand mint. Was still the old cyan in rgba form, which a hex
  // find-and-replace could not see.
  brandDim: "rgba(70, 227, 206, 0.2)",
  bg: "#05191B",
  fg: "#EAF6F5",
  muted: "#9FBDBD",
  border: "#123B3D",
} as const;

export type ThemeTokens = typeof tokens;
