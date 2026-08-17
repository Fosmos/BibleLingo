export const STREAK_MILESTONES: readonly number[] = [7, 30, 100];

// Calendar-day difference (not raw ms/24h) so a review at 11pm followed by one at 1am
// still counts as "the next day" rather than looking like a skipped day.
export function daysSinceLastCompletion(lastCompletedAt: string | null, now: Date): number {
  if (!lastCompletedAt) return 0;

  const last = new Date(lastCompletedAt);
  const lastMidnight = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = nowMidnight.getTime() - lastMidnight.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}
