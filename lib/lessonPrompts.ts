// What each stage asks of the reader, by its stage label (lib/learnSheetStage.ts and the review
// screens) — the first line of the lesson page's drill tray (DrillHelpChips.tsx).
const PROMPTS: Record<string, string> = {
  Understand: "Tap the verse apart into clauses",
  Visualize: "Picture the scene",
  "Listen and repeat": "Listen, then say each line back",
  "Read it through": "Tap through the words",
  "Write the first letter": "Write the first letter of each word",
  "Fill in the blank": "Tap the missing words in order",
  "Type it by first letter": "Type the first letter of each word",
  "Say it with hints": "Say the verse — the first letters help",
  "Say it from memory": "Say the verse from memory",
  Remember: "Type the first letter of each word",
  "Previous Verses": "Type the first letter of each word",
  Review: "Type the first letter of each word",
  Pray: "Pray over what you've learned",
};

// Stages with no help to give (nothing hidden to peek at, nothing to skip to).
const NO_HELP = new Set(["Listen and repeat", "Pray"]);

export const lessonPrompt = (label: string | undefined): string => (label ? (PROMPTS[label] ?? "") : "");
export const stageHasHelp = (label: string | undefined): boolean => !label || !NO_HELP.has(label);
