// Stages with no help to give (nothing hidden to look up, nothing to skip to) — no Letters /
// Verse / Skip chips on the lesson page (DrillHelpChips.tsx). By stage label (lib/learnSheetStage.ts).
const NO_HELP = new Set(["Listen and repeat", "Pray"]);

export const stageHasHelp = (label: string | undefined): boolean => !label || !NO_HELP.has(label);
