// Same day-math as lib/srs.ts's formatLastReviewed, worded for a flagged-into-the-bin
// timestamp instead of a review — "Reviewed today" would misleadingly read as a good review.
export function formatFlaggedAt(flaggedAt: string, now: Date = new Date()): string {
  const days = Math.floor((now.getTime() - new Date(flaggedAt).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Flagged today";
  if (days === 1) return "Flagged 1 day ago";
  return `Flagged ${days} days ago`;
}
