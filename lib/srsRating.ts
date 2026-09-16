export type SrsRating = "again" | "hard" | "good" | "easy";

// How far below the reader's own promotionThreshold (see UserProgress.srsPromotionThreshold,
// lib/srs.ts's PROMOTION_ACCURACY_THRESHOLD default 90) counts as a critical miss rather than
// an ordinary one — floored at 0 in rateSrsReview below so a very low custom threshold can't
// push this negative. At the default threshold this lands "Again" at accuracy < 70, the same
// floor a flat FSRS-style grading scheme would use.
const AGAIN_GAP = 20;
// A near-flawless review reads as "Easy" regardless of the reader's own threshold — a fixed
// ceiling, not threshold-relative, since "almost no mistakes at all" is an absolute standard
// rather than something that should loosen just because the reader set a lower pass bar.
const EASY_FLOOR = 98;

// Turns one review's accuracy (0-100, from FirstLetterTypeRep's own wrongWordIndices ratio —
// already dented by a "Peek hint" tap, which counts the same as a genuine miss, see
// useFirstLetterTyping.ts's peekHint) into a graduated four-tier rating, replacing the old
// flat pass/fail threshold with something that actually distinguishes "barely scraped by" from
// "flawless" — the same real distinction FSRS's own Again/Hard/Good/Easy grades exist to draw,
// built from the one performance signal this app already measures precisely rather than new,
// harder-to-calibrate instrumentation (a typing-speed baseline, a separate hint counter) that
// this first pass doesn't need. promotionThreshold is the reader's own configured pass bar —
// it stays the exact Hard/Good boundary, so "did I pass" still means what it always has.
export function rateSrsReview(accuracy: number, promotionThreshold: number): SrsRating {
  const againCeiling = Math.max(0, promotionThreshold - AGAIN_GAP);
  if (accuracy < againCeiling) return "again";
  if (accuracy < promotionThreshold) return "hard";
  if (accuracy < EASY_FLOOR) return "good";
  return "easy";
}

// How many lib/srs.ts BOX_ORDER steps a rating moves an entity — negative demotes, positive
// promotes. Again (a critical miss) steps back TWO boxes, a harder landing than an ordinary
// failed review, since it means most of the passage was genuinely forgotten, not just a few
// words fumbled. Hard/Good keep the original single-step behavior the old flat threshold
// already had (fail steps back one, pass steps up one). Easy jumps two boxes up ("skips" one)
// — a truly effortless review earns more breathing room before the next one than a merely-
// passing review does.
export const RATING_BOX_STEP: Record<SrsRating, number> = {
  again: -2,
  hard: -1,
  good: 1,
  easy: 2,
};
