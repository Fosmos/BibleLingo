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

// The raw calendar gap above, minus any of the reader's own weekly rest day (see
// UserProgress.restDayOfWeek) that fell strictly BETWEEN the last completion and today — only
// the days actually obligated to show up count toward a streak loss. Today itself is never in
// that range (a gap of 1 is still "might still complete today," not a missed day yet — see
// evaluateStreakOnLoad), so this only ever looks at full days already in the past.
export function obligatedGapDays(lastCompletedAt: string | null, now: Date, restDayOfWeek: number | null): number {
  const gap = daysSinceLastCompletion(lastCompletedAt, now);
  if (restDayOfWeek === null || !lastCompletedAt || gap <= 1) return gap;

  const last = new Date(lastCompletedAt);
  const cursor = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  let restDaysInGap = 0;
  for (let day = 1; day < gap; day++) {
    cursor.setDate(cursor.getDate() + 1);
    if (cursor.getDay() === restDayOfWeek) restDaysInGap++;
  }
  return Math.max(1, gap - restDaysInGap);
}
