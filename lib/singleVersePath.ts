import type { MemorizationDay } from "@/types";
import { pathKey } from "@/lib/memorizationContent";
import { activePathScope } from "@/lib/mindMapPathTarget";
import { findVerseLessonDay } from "@/lib/verseLessonAction";

// Where "Learn just vN" (the verse preview's second option, see MindMapVersePreview.tsx) goes:
// that one verse as its own single-verse path — added alongside the reader's other paths — opened
// straight into its lesson (`startLesson`, see startLessonSheet below).
export function singleVersePathHref(book: string, chapter: number, verse: number, version: string): string {
  return verseRunPathHref(verseRunPathKey(book, chapter, verse, verse), version);
}

// A run of verses chosen on the Path tab ("Learn N chosen") as its own verse path — "Book|8|5-7".
export const verseRunPathKey = (book: string, chapter: number, start: number, end: number): string =>
  pathKey("verse", `${book}|${chapter}|${start === end ? start : `${start}-${end}`}`);

export const verseRunPathHref = (key: string, version: string): string => `/path/${encodeURIComponent(key)}?version=${encodeURIComponent(version)}&startLesson=1`;

// The sheet a path opened with `startLesson` begins in: already inside the lesson for its own
// verse, rather than on the map waiting for a tap. Only a single-verse path names one verse to
// start on; anything else (or a verse with no lesson day) starts on the plain map.
export function startLessonSheet(key: string, days: MemorizationDay[]) {
  const scope = activePathScope(key);
  if (scope?.kind !== "verse" || scope.chapter === undefined || scope.verse === undefined) return null;
  const day = findVerseLessonDay(days, scope.chapter, scope.verse);
  if (!day) return null;
  return {
    kind: "verse" as const,
    tappedVerse: { book: scope.book, chapter: scope.chapter, verseNumber: scope.verse },
    lesson: { dayNumber: day.dayNumber, mode: "select" as const },
  };
}
