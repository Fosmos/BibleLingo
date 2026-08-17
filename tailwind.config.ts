import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        // Ultra-Minimalist Organic Modern design system — warm neutral base +
        // ochre accent. `brand` doubles as the app's primary-action/accent color
        // (buttons, active nav/tab states, focus rings) so retinting this one
        // scale re-themes the app's main interactive color everywhere it's used.
        paper: "#FDFBF8",
        mist: "#F2EFEA",
        line: "#E0E0E0",
        ink: {
          DEFAULT: "#1A1A1A",
          soft: "#4D4D4D",
          muted: "#999999",
        },
        brand: {
          50: "#FBF3EA",
          100: "#F6E6D3",
          200: "#EDD0AF",
          300: "#E3B98A",
          400: "#DAAD7E",
          500: "#D4A373",
          600: "#BD8A57",
          700: "#9C6F42",
          800: "#7A5732",
          900: "#5C4126",
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
