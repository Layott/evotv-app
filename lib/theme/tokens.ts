export const tokens = {
  brand: "#2CD7E3",
  brandDim: "rgba(44, 215, 227, 0.2)",
  bg: "#000000",
  fg: "#FAFAFA",
  muted: "#A3A3A3",
  border: "#262626",
} as const;

export type ThemeTokens = typeof tokens;
