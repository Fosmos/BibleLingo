// The Memorized tab's chapter reader, opened onto a path's lesson, review or practice
// (ChapterPathScreen.tsx reads these once on arrival). `fromTrail` sends you back to the Path
// tab's trail when it's done (lib/useTrailReturn.ts).
export function readerHref(pathKey: string, version: string, action: { learnDay: number } | { review: string[] } | { practiceDay: number }, fromTrail = true): string {
  const query = new URLSearchParams({ path: pathKey, version });
  if ("learnDay" in action) query.set("learnDay", String(action.learnDay));
  if ("practiceDay" in action) query.set("practiceDay", String(action.practiceDay));
  if ("review" in action) {
    query.set("review", action.review.join(","));
    query.set("start", "1");
  }
  if (fromTrail) query.set("from", "trail");
  return `/memorized?${query}`;
}

export const trailHref = (pathKey: string, version: string): string => `/path/${encodeURIComponent(pathKey)}?version=${encodeURIComponent(version)}`;
