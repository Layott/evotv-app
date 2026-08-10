export const tokens = {
  brand: "#46E3CE",
  brandDim: "rgba(44, 215, 227, 0.2)",
  bg: "#000000",
  fg: "#EAF6F5",
  muted: "#9FBDBD",
  border: "#103133",
} as const;

export type ThemeTokens = typeof tokens;
