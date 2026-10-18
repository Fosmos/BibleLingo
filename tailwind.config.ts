import type { Config } from "tailwindcss";

// Organic ramps (see the colours below), with a 50 and 950 so they can stand in for Tailwind's
// own full-range palettes.
const TERRACOTTA = {
  50: "#FFF8F3",
  100: "#FFF2EB",
  200: "#FFE1D0",
  300: "#FFC6A5",
  400: "#F6A06B",
  500: "#C67139",
  600: "#B2622D",
  700: "#8C491A",
  800: "#643312",
  900: "#402310",
  950: "#2A170A",
};
const SAGE = {
  50: "#F7FCEF",
  100: "#F0FAE1",
  200: "#E1EECC",
  300: "#CCDBB2",
  400: "#AEBF92",
  500: "#8FA073",
  600: "#728157",
  700: "#56633F",
  800: "#3D472B",
  900: "#272E1B",
  950: "#191E11",
};

const config: Config = {
  theme: {
    extend: {
      colors: {
        // White page background + warm taupe neutrals (mist/line) design system, paired with
        // a quiet, desaturated coffee/umber accent (`brand`, doubling as the app's primary-
        // action/accent color: buttons, active nav/tab states, focus rings) so retinting this
        // one scale re-themes the app's main interactive color everywhere it's used.
        // Deliberately restrained — closer to a dark neutral than a "color" — so it doesn't
        // compete with the other semantic accents (gold, heart, mastery, crack). `paper` is
        // the page's own background (see app/globals.css's --background) — plain white, kept
        // as its own token rather than a bare `bg-white` since a few surfaces (a fullscreen
        // drawing canvas, a keyboard key) reference it by name for "matches the page," not
        // "is a white card."
        // The Organic restyle (design_handoff_organic_restyle): a cream ground, a terracotta accent
        // (`brand` — buttons, active states, focus), a sage second accent (`sage`) and a warm neutral
        // ramp (`sand`). The older names below are kept and re-pointed so every existing class
        // picks the new palette up without per-file edits.
        paper: "#FAF9F6",
        mist: "#EEE7DB",
        line: "#DCD3C4",
        parchment: {
          DEFAULT: "#FAF9F6",
          heading: "#474238",
        },
        ink: {
          DEFAULT: "#201E1D",
          soft: "#474238",
          muted: "#645C50",
        },
        brand: {
          50: "#FFF8F3",
          100: "#FFF2EB",
          200: "#FFE1D0",
          300: "#FFC6A5",
          400: "#F6A06B",
          500: "#C67139",
          600: "#B2622D",
          700: "#8C491A",
          800: "#643312",
          900: "#402310",
        },
        sage: {
          DEFAULT: "#7A8A5E",
          50: "#F7FCEF",
          100: "#F0FAE1",
          200: "#E1EECC",
          300: "#CCDBB2",
          400: "#AEBF92",
          500: "#8FA073",
          600: "#728157",
          700: "#56633F",
          800: "#3D472B",
          900: "#272E1B",
        },
        sand: {
          100: "#F9F4ED",
          200: "#EEE7DB",
          300: "#DCD3C4",
          400: "#C0B6A5",
          500: "#A19786",
          600: "#82796A",
          700: "#645C50",
          800: "#474238",
          900: "#2E2B25",
        },
        // Rewards and "due" marks share the terracotta accent in the Organic restyle — `gold`, and
        // Tailwind's own amber/yellow/orange, are re-pointed at it; its green (done, correct) at
        // sage. Red (`heart`, errors) is left as it was.
        gold: TERRACOTTA,
        amber: TERRACOTTA,
        yellow: TERRACOTTA,
        orange: TERRACOTTA,
        crack: TERRACOTTA,
        green: SAGE,
        heart: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
        mastery: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
        },
        // Evening Vespers mode's own palette (see VespersView.tsx) — deliberately its OWN
        // fixed colors, not the app's usual light/dark theme pair: warm amber text on a near-
        // black ground, chosen specifically to cut blue light before bed, so it stays this
        // exact combination regardless of whether the reader's device is in light or dark mode
        // otherwise.
        vespers: {
          bg: "#0D0C0A",
          surface: "#17140F",
          ink: "#E8D9B8",
          soft: "#B8A67E",
          accent: "#D9A752",
        },
      },
      fontFamily: {
        // Caprasimo — headings, verse references, hall titles, stat numbers (one weight only).
        serif: ["var(--font-serif)", "Georgia", "serif"],
        heading: ["var(--font-serif)", "Georgia", "serif"],
        // Figtree — body text and controls.
        sans: ["var(--font-sans)", "Arial", "sans-serif"],
        // The Bible verse text's own reading serif (see ChapterPageContent.tsx) — a plain,
        // quiet OLD-STYLE text serif (Source Serif 4, the closest free match to YouVersion's
        // own paid Untitled Serif), distinct from `serif` above (Playfair Display), which is a
        // high-contrast DISPLAY face this app's headings/titles keep using — long-form verse
        // reading wants the workhorse, not the headline face.
        // Verse text — Figtree too in the Organic restyle (it was a separate reading serif).
        reading: ["var(--font-reading)", "Arial", "sans-serif"],
      },
      borderRadius: {
        organic: "28px",
      },
      boxShadow: {
        "organic-sm": "0 1px 2px rgba(46,43,37,.14)",
        "organic-md": "0 3px 10px rgba(46,43,37,.16)",
        "organic-lg": "0 12px 32px rgba(46,43,37,.22)",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        88: "22rem",
      },
      fontSize: {
        display: ["2.75rem", { lineHeight: "1.1", fontWeight: "400" }],
        // Bumped up from 1.5rem/600 — this app's one shared "screen headline" scale (see
        // globals.css's own `.text-title` weight override), used everywhere from page
        // headers down to a lesson's own stage title and a drill's verse reference, so
        // sizing it up here reaches every one of those at once.
        title: ["1.875rem", { lineHeight: "1.2", fontWeight: "400" }],
        caption: ["0.75rem", { lineHeight: "1.4", fontWeight: "500" }],
      },
    },
  },
};

export default config;
