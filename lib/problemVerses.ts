// A single verse's SRS review accuracy below this flags it into the Problem Verses bin (see
// types/index.ts's UserProgress.problemVerses) — distinct from and lower than
// lib/srs.ts's PROMOTION_ACCURACY_THRESHOLD, since this is a "needs extra attention" signal
// rather than the box-promotion gate. A later review scoring PROMOTION_ACCURACY_THRESHOLD or
// higher clears the verse back out (see SrsReviewSession.tsx) — a score strictly between the
// two thresholds leaves it flagged, neither adding nor removing it.
export const PROBLEM_VERSE_ACCURACY_THRESHOLD = 80;

// Same day-math as lib/srs.ts's formatLastReviewed, worded for a flagged-into-the-bin
// timestamp instead of a review — "Reviewed today" would misleadingly read as a good review.
export function formatFlaggedAt(flaggedAt: string, now: Date = new Date()): string {
  const days = Math.floor((now.getTime() - new Date(flaggedAt).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Flagged today";
  if (days === 1) return "Flagged 1 day ago";
  return `Flagged ${days} days ago`;
}
