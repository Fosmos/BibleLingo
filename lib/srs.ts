import type { SRSState } from "@/types";

// Fixed review cadence (not SM-2-style growth): daily for the first week,
// weekly for the following month, then monthly indefinitely.
const DAILY_INTERVAL_DAYS = 1;
const WEEKLY_INTERVAL_DAYS = 7;
const MONTHLY_INTERVAL_DAYS = 30;
const DAILY_PHASE_REPS = 7;
const WEEKLY_PHASE_REPS = 4;

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function intervalForRepetition(repetitionCount: number): number {
  if (repetitionCount <= DAILY_PHASE_REPS) return DAILY_INTERVAL_DAYS;
  if (repetitionCount <= DAILY_PHASE_REPS + WEEKLY_PHASE_REPS) return WEEKLY_INTERVAL_DAYS;
  return MONTHLY_INTERVAL_DAYS;
}

// New entities are due immediately — the first spaced-repetition rep should happen
// soon after a verse graduates into the Memorized section, not be deferred.
export function createInitialSRSState(now: Date = new Date()): SRSState {
  return {
    repetitionCount: 0,
    intervalDays: 0,
    lastReviewedAt: null,
    nextDueAt: now.toISOString(),
  };
}

// Every review in this app is retry-until-correct (no partial-credit grading anywhere
// else in the app), so "passed" always means "eventually recited correctly." A failed
// review drops back to the daily phase rather than just repeating the same interval.
export function scheduleReview(state: SRSState, passed: boolean, now: Date = new Date()): SRSState {
  if (!passed) {
    return {
      repetitionCount: 0,
      intervalDays: DAILY_INTERVAL_DAYS,
      lastReviewedAt: now.toISOString(),
      nextDueAt: addDays(now, DAILY_INTERVAL_DAYS).toISOString(),
    };
  }

  const repetitionCount = state.repetitionCount + 1;
  const intervalDays = intervalForRepetition(repetitionCount);

  return {
    repetitionCount,
    intervalDays,
    lastReviewedAt: now.toISOString(),
    nextDueAt: addDays(now, intervalDays).toISOString(),
  };
}

export function isDue(state: SRSState, now: Date = new Date()): boolean {
  if (!state.nextDueAt) return true;
  return new Date(state.nextDueAt).getTime() <= now.getTime();
}

// A short "3 days ago" / "Never reviewed" tag for due-list rows — deliberately coarse
// (whole days only), matching this module's fixed-cadence (not SM-2) review scheduling.
export function formatLastReviewed(lastReviewedAt: string | null, now: Date = new Date()): string {
  if (!lastReviewedAt) return "Never reviewed";
  const days = Math.floor((now.getTime() - new Date(lastReviewedAt).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Reviewed today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

// Where a manually-added "I already knew this one" verse should enter the schedule —
// lets it skip straight to the phase matching how well the user already knows it,
// instead of always re-entering at the very start of the daily phase.
export type SrsPhase = "daily" | "weekly" | "monthly";

export function createSeedSRSState(phase: SrsPhase, now: Date = new Date()): SRSState {
  if (phase === "daily") return createInitialSRSState(now);

  // Seeded as if a review had just been completed at the first repetition of that phase,
  // so it next comes due after a full interval of that phase rather than immediately.
  const repetitionCount = phase === "weekly" ? DAILY_PHASE_REPS + 1 : DAILY_PHASE_REPS + WEEKLY_PHASE_REPS + 1;
  const intervalDays = intervalForRepetition(repetitionCount);
  return {
    repetitionCount,
    intervalDays,
    lastReviewedAt: now.toISOString(),
    nextDueAt: addDays(now, intervalDays).toISOString(),
  };
}
