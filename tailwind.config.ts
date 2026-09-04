import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        // Warm parchment + terracotta design system — muted, low-contrast neutrals
        // (paper/mist/line, all warm cream-to-taupe) paired with an earthy chestnut
        // accent (`brand`, doubling as the app's primary-action/accent color:
        // buttons, active nav/tab states, focus rings) so retinting this one
        // scale re-themes the app's main interactive color everywhere it's used.
        paper: "#F2EFE9",
        mist: "#E2DCD5",
        line: "#C8BEB3",
        ink: {
          DEFAULT: "#2C2724",
          soft: "#5A5450",
          muted: "#8A8178",
        },
        brand: {
          50: "#FAF1EA",
          100: "#F3E0D0",
          200: "#E6C3AC",
          300: "#D6A582",
          400: "#C08A60",
          500: "#A2724D",
          600: "#8B5330",
          700: "#743F22",
          800: "#5C3119",
          900: "#432310",
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
        title: ["1.5rem", { lineHeight: "1.25", fontWeight: "600" }],
        caption: ["0.75rem", { lineHeight: "1.4", fontWeight: "500" }],
      },
    },
  },
};

export default config;
