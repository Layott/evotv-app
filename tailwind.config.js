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
        // EVO brand, sampled from the wordmark rather than picked: it is a
        // gradient from blue #42ACE8 to mint #46E3CE, and evo-tv-hero.png sits
        // on the dark teal used for `background` below. Kept in lockstep with
        // the web tokens in EVOTV/app/globals.css - the two must not drift.
        brand: {
          DEFAULT: "#46E3CE",
          50: "#EAFAF8",
          100: "#C9F3EE",
          200: "#9AE9DF",
          300: "#6CE0D2",
          400: "#46E3CE",
          500: "#2FC9BE",
          600: "#22A3A4",
          700: "#1B7F88",
          800: "#175F68",
          900: "#134A52",
        },
        // The blue end of the wordmark gradient, for the rare place that needs
        // to sit apart from the mint without inventing a new hue.
        "brand-blue": "#42ACE8",

        // Semantic tokens, dark-first. Warm neutral greys replaced by the teal
        // family so surfaces sit in the same world as the wordmark.
        background: "#05191B",
        foreground: "#EAF6F5",
        card: "#0A2426",
        "card-foreground": "#EAF6F5",
        popover: "#0A2426",
        "popover-foreground": "#EAF6F5",
        primary: "#46E3CE",
        "primary-foreground": "#05191B",
        secondary: "#103133",
        "secondary-foreground": "#EAF6F5",
        muted: "#103133",
        "muted-foreground": "#9FBDBD",
        accent: "#103133",
        "accent-foreground": "#EAF6F5",
        destructive: "#FF4A38",
        "destructive-foreground": "#FFE6E2",
        // Barely there on purpose. The old #262626 outlined every card, which
        // is the hairline-box look being removed across the product.
        border: "#12383A",
        input: "#17454A",
        ring: "#46E3CE",
      },
      fontFamily: {
        sans: ["Geist", "System"],
        mono: ["GeistMono", "Menlo"],
      },
      // Tighter than before (6/8/10/14). Big soft radii on every element is
      // part of the generic look; matches --radius: 0.3rem on the web.
      borderRadius: {
        sm: "3px",
        md: "5px",
        lg: "7px",
        xl: "10px",
      },
    },
  },
  plugins: [],
};
