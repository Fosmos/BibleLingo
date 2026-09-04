// A local-calendar-day key (YYYY-MM-DD, in the reader's own timezone, not UTC) — used
// wherever something should gate "once per day" against the reader's own clock rather than
// completion count (see store/buildingViewActions.ts's markBuildingViewReviewedToday).
export function todayDateKey(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
