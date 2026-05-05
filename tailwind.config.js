/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // EVO brand
        brand: {
          DEFAULT: "#2CD7E3",
          50: "#EAFAFC",
          100: "#C9F2F6",
          200: "#9AE7EE",
          300: "#6BDCE5",
          400: "#3CD1DD",
          500: "#2CD7E3",
          600: "#1FAFB9",
          700: "#16878E",
          800: "#0E5F64",
          900: "#06373A",
        },
        // shadcn semantic tokens (mirrored from web globals.css, dark theme — app is dark-first)
        background: "#0A0A0A",
        foreground: "#FAFAFA",
        card: "#0A0A0A",
        "card-foreground": "#FAFAFA",
        popover: "#0A0A0A",
        "popover-foreground": "#FAFAFA",
        primary: "#FAFAFA",
        "primary-foreground": "#0A0A0A",
        secondary: "#262626",
        "secondary-foreground": "#FAFAFA",
        muted: "#262626",
        "muted-foreground": "#A3A3A3",
        accent: "#262626",
        "accent-foreground": "#FAFAFA",
        destructive: "#7F1D1D",
        "destructive-foreground": "#FCA5A5",
        border: "#262626",
        input: "#262626",
        ring: "#525252",
      },
      fontFamily: {
        sans: ["Geist", "System"],
        mono: ["GeistMono", "Menlo"],
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "14px",
      },
    },
  },
  plugins: [],
};
