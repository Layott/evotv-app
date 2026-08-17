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
          // DEFAULT follows the theme: full-strength mint is unreadable on a
          // light ground, so the light palette darkens it. The numbered ladder
          // stays literal - those are picked shades, not semantic roles.
          DEFAULT: "rgb(var(--brand) / <alpha-value>)",
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
        "brand-blue": "rgb(var(--brand-blue) / <alpha-value>)",

        /*
         * Semantic tokens, read from CSS variables so they follow the
         * appearance setting.
         *
         * These were fixed hex, which is why choosing Light in Settings did
         * nothing: there was one palette and no second one to switch to. The
         * values now live in `global.css` under `:root` and `.dark:root`, and
         * every `bg-background` / `text-foreground` / `bg-card/40` in the app
         * follows the theme without a single component changing.
         *
         * `<alpha-value>` is what keeps the `/40` opacity modifiers working.
         */
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        "card-foreground": "rgb(var(--card-foreground) / <alpha-value>)",
        popover: "rgb(var(--popover) / <alpha-value>)",
        "popover-foreground": "rgb(var(--popover-foreground) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        "primary-foreground": "rgb(var(--primary-foreground) / <alpha-value>)",
        secondary: "rgb(var(--secondary) / <alpha-value>)",
        "secondary-foreground": "rgb(var(--secondary-foreground) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        "muted-foreground": "rgb(var(--muted-foreground) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-foreground": "rgb(var(--accent-foreground) / <alpha-value>)",
        destructive: "rgb(var(--destructive) / <alpha-value>)",
        "destructive-foreground": "rgb(var(--destructive-foreground) / <alpha-value>)",
        /*
         * Transparent in both themes. The owner banned hairline borders
         * outright on 2026-08-17: structure comes from filled surfaces and
         * space, never a 1px stroke. `input` stays visible so form fields
         * keep an edge.
         */
        border: "transparent",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)"
      },
      // One family, headings and body, matching the website. The names are the
      // keys registered in `components/providers/font-loader.tsx`, not the
      // fonts' internal family names: React Native resolves what expo-font was
      // given, and each weight is registered separately because RN does not
      // synthesise weights on Android.
      //
      // `display` is Archivo instanced at wdth 118, the same width the web sets
      // its headings at.
      fontFamily: {
        sans: ["Archivo", "System"],
        medium: ["ArchivoMedium", "System"],
        semibold: ["ArchivoSemiBold", "System"],
        bold: ["ArchivoBold", "System"],
        display: ["ArchivoDisplay", "System"],
        "display-heavy": ["ArchivoDisplayHeavy", "System"],
        mono: ["MartianMono", "Menlo"],
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
