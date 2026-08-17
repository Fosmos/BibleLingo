import type { MemorizationDay } from "@/types";

// The fixed number of sub-stages LearnVerseStage cycles through per verse — see the PHASES
// array there (speak_with_view, type_with_view, fill_1-3, first_letter, speak_blind).
const LEARN_SUB_STAGE_COUNT = 7;

// VerseLessonFlow.PHASES is a fixed 4-slot scheme (previousReview, review, learn,
// postReview) — "learn" is always slot 2 and the array length is always 4, regardless of
// which optional slots (previousReview, postReview) end up skipped for a given day, since
// skipping just jumps phaseIndex past that slot rather than renumbering the rest.
const LEARN_DAY_PHASE_SLOT_COUNT = 4;
const LEARN_DAY_LEARN_SLOT_INDEX = 2;

type Checkpoints = Record<string, Record<string, number>>;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

// Approximates how far into an in-progress lesson/session the user got, purely from
// sessionCheckpoints — used to draw a progress bar under the "unlocked" day circle in
// DayPathDiagram. Returns 0 for a day with no checkpoint yet (not started). Deliberately
// coarse: it mirrors each stage/phase's own checkpoint shape rather than trying to weight
// every rep individually.
export function getDayProgress(day: MemorizationDay, sessionKey: string, checkpoints: Checkpoints): number {
  const dayCp = checkpoints[sessionKey];
  if (!dayCp) return 0;

  if (day.kind === "learn") {
    const phaseIndex = dayCp.phaseIndex ?? 0;
    let progress = phaseIndex / LEARN_DAY_PHASE_SLOT_COUNT;

    if (phaseIndex === LEARN_DAY_LEARN_SLOT_INDEX) {
      const verseIndex = dayCp.learnVerseIndex ?? 0;
      const verse = day.newVerses[verseIndex];
      const verseCp = verse ? checkpoints[`${sessionKey}:${verse.id}`] : undefined;
      const subPhaseIndex = verseCp?.phaseIndex ?? 0;
      const verseFraction = (verseIndex + subPhaseIndex / LEARN_SUB_STAGE_COUNT) / Math.max(day.newVerses.length, 1);
      progress += verseFraction / LEARN_DAY_PHASE_SLOT_COUNT;
    }

    return clamp01(progress);
  }

  if (day.kind === "chapter_review") {
    const phaseCount = (day.previousVerses?.length ?? 0) > 0 ? 4 : 3;
    return clamp01((dayCp.phaseIndex ?? 0) / phaseCount);
  }

  if (day.kind === "boss_battle" || day.kind === "chapter_boss_battle") {
    return clamp01((dayCp.verseIndex ?? 0) / Math.max(day.reviewVerses.length, 1));
  }

  // weekly_review / monthly_review run through ReviewSection's default "pre" phase.
  const stageCount = day.reviewStages?.filter((stage) => stage.verses.length > 0).length || 1;
  return clamp01((dayCp["reviewStageIndex:pre"] ?? 0) / stageCount);
}
