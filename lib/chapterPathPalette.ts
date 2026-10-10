// The Chapter Path View's pericope colours (design_handoff_chapter_path_view): each pericope in a
// chapter takes the next entry, cycling — a base colour (its nodes and road), a light tint (its
// box) and a deep ink (its heading). Exposed to Tailwind as CSS variables on the pericope box
// (--p / --t / --k), so classes like `bg-[var(--t)]` pick them up without inline styles.

export interface PericopeColour {
  base: string;
  tint: string;
  ink: string;
}

export const PERICOPE_COLOURS: PericopeColour[] = [
  { base: "#7a8a5e", tint: "#F0FAE1", ink: "#3D472B" },
  { base: "#c67139", tint: "#FFF2EB", ink: "#643312" },
  { base: "oklch(0.58 0.09 250)", tint: "oklch(0.94 0.025 250)", ink: "oklch(0.40 0.08 250)" },
  { base: "oklch(0.68 0.12 80)", tint: "oklch(0.95 0.04 85)", ink: "oklch(0.45 0.09 70)" },
  { base: "oklch(0.56 0.09 330)", tint: "oklch(0.94 0.025 330)", ink: "oklch(0.40 0.08 330)" },
  { base: "oklch(0.60 0.08 190)", tint: "oklch(0.94 0.025 190)", ink: "oklch(0.40 0.07 190)" },
];

export const pericopeColour = (index: number): PericopeColour => PERICOPE_COLOURS[index % PERICOPE_COLOURS.length];

// A learned verse reads as first letters only, keeping leading and trailing punctuation —
// "There is therefore now no condemnation" → "T i t n n c".
export function firstLettersOnly(line: string): string {
  return line
    .split(/\s+/)
    .map((word) => word.replace(/^([^A-Za-z]*)([A-Za-z])[A-Za-z’']*/, "$1$2"))
    .join(" ");
}

// The path's regular wave: each verse node's left offset in the 64px gutter, by verse index.
export const NODE_LANE_CLASSES = ["ml-[2px]", "ml-[16px]", "ml-[30px]", "ml-[16px]"];
