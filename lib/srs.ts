import type { SRSState, SrsBox } from "@/types";
import { rateSrsReview, RATING_BOX_STEP } from "@/lib/srsRating";

// Leitner-box review cadence ("Sword of the Spirit" — see components/gamification/
// SwordOfTheSpirit.tsx): 5 boxes, each with its own fixed interval. A review's first-letter-
// typing accuracy is first turned into a graduated Again/Hard/Good/Easy rating (see
// lib/srsRating.ts's rateSrsReview) and moves the entity by that rating's own number of boxes
// (RATING_BOX_STEP) — a critical miss (Again) steps back two, an ordinary miss (Hard) steps
// back one, a pass (Good) steps up one, a flawless review (Easy) steps up two — always clamped
// within BOX_ORDER's own bounds (see stepBox). A full reset-to-Box-1 on any lapse was the
// original design here; changed deliberately, since resetting a long-form chapter/book
// passage's entire climb over one soft review risks reading as punishing enough to abandon
// review altogether — a graduated step-down still re-tightens the review cadence right away
// without that cliff, and now scales with how badly the review actually went rather than
// treating every miss the same.
//
// The "every 3 days" box was added after ids 1-4 already existed and sits between the daily
// and weekly boxes in review-frequency order — but it keeps its own numeric id (5) rather
// than renumbering 2/3/4, since those ids are already persisted on real entities and
// reinterpreting them would silently change an existing entity's cadence. So `SrsBox` ids are
// NOT in ascending-interval order; BOX_ORDER below is. The "Box N" number shown to the user
// (see boxDisplayNumber) is sequential by position in BOX_ORDER, not the raw id, so what's
// displayed always reads as ascending review frequency regardless of this id history.
export const BOX_INTERVAL_DAYS: Record<SrsBox, number> = {
  1: 1,
  5: 3,
  2: 7,
  3: 14,
  4: 30,
};

// The ascending promotion order, by id — see the id-vs-display-number note above. Anything
// that needs to walk every box in cadence order (e.g. SwordOfTheSpirit.tsx's overview, or
// promotion below) should use this instead of assuming ids are already in order.
export const BOX_ORDER: SrsBox[] = [1, 5, 2, 3, 4];

export const PROMOTION_ACCURACY_THRESHOLD = 90;

// Moves `box` by `steps` positions along BOX_ORDER — negative steps back, positive steps up —
// clamped to BOX_ORDER's own ends rather than wrapping or going out of range.
function stepBox(box: SrsBox, steps: number): SrsBox {
  const index = BOX_ORDER.indexOf(box);
  const clamped = Math.min(Math.max(index + steps, 0), BOX_ORDER.length - 1);
  return BOX_ORDER[clamped];
}

// The "Box N" number shown to the user — sequential by position in BOX_ORDER (1-5), not the
// internal SrsBox id, so the displayed numbers always read as ascending review frequency:
// Box 1 (daily), Box 2 (every 3 days), Box 3 (weekly), Box 4 (biweekly), Box 5 (monthly).
export function boxDisplayNumber(box: SrsBox): number {
  return BOX_ORDER.indexOf(box) + 1;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Nudges a computed due date one day later if it would otherwise land exactly on the
// reader's own weekly rest day (see UserProgress.restDayOfWeek) — so a fresh review's own
// cadence never itself creates pressure to show up on the day off. Only ever shifts by the
// one day (never loops past a second rest-day collision, which can't happen for a single day
// of the week shifted by one), and does nothing when no rest day is set.
function skipRestDay(date: Date, restDayOfWeek: number | null): Date {
  if (restDayOfWeek === null || date.getDay() !== restDayOfWeek) return date;
  return addDays(date, 1);
}

export function createInitialSRSState(now: Date = new Date()): SRSState {
  return { box: 1, lastReviewedAt: null, nextDueAt: now.toISOString() };
}

function isValidBox(value: unknown): value is SrsBox {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

// accuracy is the 0-100 score from the review's first-letter-typing drill (see
// FirstLetterTypeRep's wrongWordIndices-based accuracy, reported through
// SrsReviewSession -> recordSrsReview). state.box is re-validated rather than trusted as-is
// — an entity created before this box system existed has no box field at all, and treating
// that as Box 1 here (rather than doing arithmetic on undefined) is what lets it self-heal
// into a real box on its very next review instead of crashing. promotionThreshold defaults
// to PROMOTION_ACCURACY_THRESHOLD but is overridable — see UserProgress.srsPromotionThreshold
// and useProgressStore.ts's recordSrsReview, which passes the reader's own configured value.
export function scheduleReview(
  state: SRSState,
  accuracy: number,
  now: Date = new Date(),
  promotionThreshold: number = PROMOTION_ACCURACY_THRESHOLD,
  restDayOfWeek: number | null = null,
): SRSState {
  const currentBox = isValidBox(state.box) ? state.box : 1;
  const rating = rateSrsReview(accuracy, promotionThreshold);
  const box: SrsBox = stepBox(currentBox, RATING_BOX_STEP[rating]);
  const intervalDays = BOX_INTERVAL_DAYS[box];
  const nextDueAt = skipRestDay(addDays(now, intervalDays), restDayOfWeek);
  return { box, lastReviewedAt: now.toISOString(), nextDueAt: nextDueAt.toISOString() };
}

export function isDue(state: SRSState, now: Date = new Date()): boolean {
  if (!state.nextDueAt) return true;
  return new Date(state.nextDueAt).getTime() <= now.getTime();
}

export function formatLastReviewed(lastReviewedAt: string | null, now: Date = new Date()): string {
  if (!lastReviewedAt) return "Never reviewed";
  const days = Math.floor((now.getTime() - new Date(lastReviewedAt).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Reviewed today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

// The SwordOfTheSpirit overview's per-entity due countdown — null (never scheduled) reads
// the same as already due, matching isDue's own treatment of a null nextDueAt above. Rounds
// up (ceil) rather than down, since a due date is a point in time later today counts as
// "later today," not "0 days away."
export function formatNextReview(nextDueAt: string | null, now: Date = new Date()): string {
  if (!nextDueAt) return "Due now";
  const days = Math.ceil((new Date(nextDueAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Due now";
  if (days === 1) return "Next review in 1 day";
  return `Next review in ${days} days`;
}

export type SrsPhase = "daily" | "every3days" | "weekly" | "biweekly" | "monthly";

const PHASE_BOX: Record<SrsPhase, SrsBox> = { daily: 1, every3days: 5, weekly: 2, biweekly: 3, monthly: 4 };

// Lets a manually-added "I already knew this" entry seed straight into whichever box
// matches how well the user says they already know it, instead of starting at Box 1.
export function createSeedSRSState(phase: SrsPhase, now: Date = new Date()): SRSState {
  if (phase === "daily") return createInitialSRSState(now);
  const box = PHASE_BOX[phase];
  const intervalDays = BOX_INTERVAL_DAYS[box];
  return { box, lastReviewedAt: now.toISOString(), nextDueAt: addDays(now, intervalDays).toISOString() };
}
