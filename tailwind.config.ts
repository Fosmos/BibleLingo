import type { Config } from "tailwindcss";

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
        paper: "#FFFFFF",
        mist: "#E2DCD5",
        line: "#C8BEB3",
        // The physical "page" the Path view's chapter text sits on (see ChapterReadingView.tsx)
        // — a soft warm ivory, distinct from the app's own plain white `paper` background but
        // deliberately much less saturated/yellow than an "aged manila folder" tan — a refined
        // stationery feel rather than a costume-y old-scroll one. heading is the pericope
        // section-title tint. A completed verse's own number/checkmark uses a plain Tailwind
        // green instead of a parchment-family tint — "done" reads as its own universal color,
        // not a variation on the page's own palette.
        parchment: {
          DEFAULT: "#F5F1E8",
          heading: "#5C4D41",
        },
        ink: {
          DEFAULT: "#2C2724",
          soft: "#5A5450",
          muted: "#8A8178",
        },
        brand: {
          50: "#F5F1EC",
          100: "#E8DFD3",
          200: "#D3C4B0",
          300: "#B79E82",
          400: "#96795D",
          500: "#6B5644",
          600: "#574434",
          700: "#453529",
          800: "#33271E",
          900: "#221A14",
        },
        gold: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
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
        crack: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
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
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Arial", "sans-serif"],
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        88: "22rem",
      },
      fontSize: {
        display: ["2.75rem", { lineHeight: "1.1", fontWeight: "700" }],
        // Bumped up from 1.5rem/600 — this app's one shared "screen headline" scale (see
        // globals.css's own `.text-title` weight override), used everywhere from page
        // headers down to a lesson's own stage title and a drill's verse reference, so
        // sizing it up here reaches every one of those at once.
        title: ["1.875rem", { lineHeight: "1.2", fontWeight: "700" }],
        caption: ["0.75rem", { lineHeight: "1.4", fontWeight: "500" }],
      },
    },
  },
};

export default config;
