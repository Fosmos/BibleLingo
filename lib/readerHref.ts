import type { PassageReview } from "@/lib/trailReviews";

// The Memorized tab's chapter reader, opened onto a path's lesson, review or practice
// (ChapterPathScreen.tsx reads these once on arrival). `fromTrail` sends you back to the Path
// tab's trail when it's done (lib/useReaderArrivals.ts) — or, "palace", to the Palace path, or, "quest", to the Quest map, or, "duo", to the Duolingo-style path.
// `verse` ("chapter:verse") narrows a lesson or practice to that one verse of its day. `passage`
// reviews a pericope or chapter of the trail (lib/trailReviews.ts), on the page of lesson `day`.
// `select` ("chapter:verse") just opens the reader on that verse, selected, its action ready.
type ReaderAction = { select: string } | { learnDay: number; verse?: string } | { review: string[] } | { practiceDay: number; verse?: string } | { passage: PassageReview; day: number };

export function readerHref(pathKey: string, version: string, action: ReaderAction, fromTrail: boolean | "palace" | "quest" | "duo" = true): string {
  const query = new URLSearchParams({ path: pathKey, version });
  if ("passage" in action) {
    const { key, chapter, from, to } = action.passage;
    query.set("practiceDay", String(action.day));
    query.set("passage", `${key}|${chapter}:${from}-${to}`);
  }
  if ("select" in action) query.set("select", action.select);
  if ("verse" in action && action.verse) query.set("verse", action.verse);
  if ("learnDay" in action) query.set("learnDay", String(action.learnDay));
  if ("practiceDay" in action) query.set("practiceDay", String(action.practiceDay));
  if ("review" in action) {
    query.set("review", action.review.join(","));
    query.set("start", "1");
  }
  if (fromTrail) query.set("from", fromTrail === true ? "trail" : fromTrail);
  return `/memorized?${query}`;
}

// The Path tab for a path: its map, or with `section` one section's trail ("current": the one you're on).
// The Palace tab for a path (BookStructureScreen.tsx).
export const palaceHref = (pathKey: string, version: string): string => `/path/${encodeURIComponent(pathKey)}/palace?version=${encodeURIComponent(version)}`;

// The experimental Quest tab for a path (QuestScreen.tsx).
export const questHref = (pathKey: string, version: string): string => `/path/${encodeURIComponent(pathKey)}/quest?version=${encodeURIComponent(version)}`;

// The Path tab's Duolingo-style path for a path (DuoPathScreen.tsx).
export const duoHref = (pathKey: string, version: string): string => `/path/${encodeURIComponent(pathKey)}/duo?version=${encodeURIComponent(version)}`;

export const trailHref = (pathKey: string, version: string, section?: number | "current"): string =>
  `/path/${encodeURIComponent(pathKey)}?version=${encodeURIComponent(version)}${section === undefined ? "" : `&section=${section}`}`;
