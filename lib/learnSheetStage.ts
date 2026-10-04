import type { MemorizationDay } from "@/types";
import type { SheetStage } from "@/store/useLessonSessionStore";
import type { FlatStep } from "@/lib/learnSteps";
import { formatVerseRangeLabel, formatVerseSpanLabel } from "@/lib/chapterContent";

// The lesson sheet's stage names (the Organic restyle's header).
const STAGE_LABELS: Record<FlatStep["phase"], string> = {
  orientation: "Understand",
  orientation_summary: "Visualize",
  listen_verse: "Listen and repeat",
  rhythm: "Read it through",
  draw_first_letters: "Write the first letter",
  fill_in_the_blank: "Fill in the blank",
  fill_in_the_blank_letters: "Type it by first letter",
  speak_hint: "Say it with hints",
  speak_verse: "Say it from memory",
  type_cumulative_today: "Remember",
  pray: "Pray",
};

// What a Learn lesson shows in the sheet header at `stepIndex`: the stage, the verse it drills
// (or the lesson's range, for whole-lesson stages), and its place among the run of stages for
// that same verse — the step bar's segments.
export function learnSheetStage(steps: FlatStep[], stepIndex: number, day: MemorizationDay): SheetStage | null {
  const step = steps[stepIndex];
  if (!step) return null;
  const verse = step.verseIndex === undefined ? undefined : day.newVerses[step.verseIndex];
  const sameGroup = (other: FlatStep) => other.verseIndex === step.verseIndex && (step.verseIndex !== undefined || other === step);
  let start = stepIndex;
  while (start > 0 && sameGroup(steps[start - 1])) start--;
  let end = stepIndex;
  while (end < steps.length - 1 && sameGroup(steps[end + 1])) end++;
  return {
    label: STAGE_LABELS[step.phase],
    reference: verse ? formatVerseSpanLabel(verse.book, verse.chapter, verse.verseNumber, verse.verseNumber) : formatVerseRangeLabel(day.newVerses),
    step: stepIndex - start,
    steps: end - start + 1,
  };
}
