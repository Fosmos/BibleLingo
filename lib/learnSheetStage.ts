import type { MemorizationDay } from "@/types";
import type { SheetStage } from "@/store/useLessonSessionStore";
import type { FlatStep } from "@/lib/learnSteps";
import { formatVerseRangeLabel, formatVerseSpanLabel } from "@/lib/chapterContent";
import { senseLineCount } from "@/lib/senseLineSlice";

// The lesson sheet's stage names (the Organic restyle's header).
export const STAGE_LABELS: Record<FlatStep["phase"], string> = {
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

// The stages that teach a verse rather than test recall — while one runs on the Path tab's reader,
// the verses after it stay readable; a review step (Review, Remember, Chapter Review)
// blanks them (ChapterPathScreen.tsx).
const TEACHING = new Set(["orientation", "orientation_summary", "listen_verse", "rhythm", "draw_first_letters", "fill_in_the_blank", "fill_in_the_blank_letters", "speak_hint", "speak_verse", "pray"] as const);
export const TEACHING_STAGE_LABELS = new Set([...TEACHING].map((phase) => STAGE_LABELS[phase]));

// What a Learn lesson shows in the sheet header at `stepIndex`: the stage, the verse it drills
// (or the lesson's range, for whole-lesson stages), and its place among the run of stages for
// that same verse (or, for a sense-line stage, that same line) — the step bar's segments.
export function learnSheetStage(steps: FlatStep[], stepIndex: number, day: MemorizationDay): SheetStage | null {
  const step = steps[stepIndex];
  if (!step) return null;
  const verse = step.verseIndex === undefined ? undefined : day.newVerses[step.verseIndex];
  // A sense-line stage groups with the other stages of the same line (the line its range ends on).
  const sameGroup = (other: FlatStep) =>
    other.verseIndex === step.verseIndex && (step.verseIndex !== undefined || other === step) && other.lines?.[1] === step.lines?.[1];
  let start = stepIndex;
  while (start > 0 && sameGroup(steps[start - 1])) start--;
  let end = stepIndex;
  while (end < steps.length - 1 && sameGroup(steps[end + 1])) end++;
  return {
    label: STAGE_LABELS[step.phase],
    reference: verse
      ? `${formatVerseSpanLabel(verse.book, verse.chapter, verse.verseNumber, verse.verseNumber)}${step.lines ? ` · line ${step.lines[1] + 1} of ${senseLineCount(verse)}` : ""}`
      : formatVerseRangeLabel(day.newVerses),
    step: stepIndex - start,
    steps: end - start + 1,
  };
}
