"use client";

import type { MemorizationDay, VerseSegment } from "@/types";
import type { MindMapData } from "@/lib/useMindMapData";
import type { LessonFocusVerse } from "@/store/useLessonSessionStore";
import { useProgressStore } from "@/store/useProgressStore";
import { findVerseLessonDay, verseLessonAction, type VerseLessonAction } from "@/lib/verseLessonAction";
import { useYesterdayReview } from "@/lib/useYesterdayReview";
import { activePathScope } from "@/lib/mindMapPathTarget";
import { resolvePathLabel } from "@/lib/memorizationContent";

// Everything InPlaceLessonSession.tsx needs to run one path's lessons.
export interface LessonSource {
  pathKey: string;
  label: string;
  days: MemorizationDay[];
  verses: VerseSegment[];
  version: string;
  completedDays: number;
  todaysDay: number;
}

interface VerseLesson {
  source: LessonSource | undefined;
  previewVerse: VerseSegment | undefined;
  lessonDay: MemorizationDay | undefined;
  action: VerseLessonAction | null;
  // "Learn just vN" — only when the tapped verse's lesson covers more than that one verse, it's
  // still to be learned, and this isn't already a single-verse path.
  canLearnSingleVerse: boolean;
}

// Which path's lesson a tapped verse opens: the page's own (focused) path when it covers the
// verse, otherwise the path the map draws around it (see lib/mindMapPathTarget.ts's
// mapHostPathKey) — so with several paths in one book, every verse on the map opens the lesson
// that actually teaches it, and none is left without one.
export function useVerseLessonSource(page: LessonSource, mapData: MindMapData, tapped: LessonFocusVerse | undefined, previewing: boolean): VerseLesson {
  const mapSource: LessonSource | undefined =
    mapData.status === "ready" && mapData.pathKey !== page.pathKey
      ? {
          pathKey: mapData.pathKey,
          label: resolvePathLabel(mapData.pathKey) ?? mapData.label,
          days: mapData.days,
          verses: mapData.verses,
          version: mapData.version,
          completedDays: mapData.completedDays,
          todaysDay: mapData.todaysDay,
        }
      : undefined;
  const pageDay = tapped ? findVerseLessonDay(page.days, tapped.chapter, tapped.verseNumber) : undefined;
  const mapDay = tapped && !pageDay && mapSource ? findVerseLessonDay(mapSource.days, tapped.chapter, tapped.verseNumber) : undefined;
  const source = pageDay ? page : mapDay ? mapSource : undefined;
  const lessonDay = pageDay ?? mapDay;
  const previewVerse = tapped
    ? (source ?? page).verses.find((verse) => verse.chapter === tapped.chapter && verse.verseNumber === tapped.verseNumber)
    : undefined;
  // Read once, not subscribed: only the preview's Learn/Continue label needs it, and checkpoints
  // can't change while previewing. A live subscription went stale the instant a lesson started —
  // its first checkpoint, written during render, re-rendered the sheet mid-lesson (a React
  // setState-in-render warning).
  const hasCheckpoint = previewing && !!source && !!lessonDay && `${source.pathKey}:${lessonDay.dayNumber}` in useProgressStore.getState().sessionCheckpoints;
  // While today's lesson still owes a review of yesterday's verses (lib/useYesterdayReview.ts), a
  // tap on one of those verses, or on today's, leads into today's lesson — which starts with that
  // review — rather than a practice run or a jump straight to the new verses.
  const reviewSource = source ?? page;
  const review = useYesterdayReview(reviewSource.pathKey, reviewSource.days, reviewSource.completedDays, reviewSource.todaysDay);
  const tappedKey = tapped ? `${tapped.book}:${tapped.chapter}:${tapped.verseNumber}` : "";
  const reviewFirst = review.pending && (review.verseKeys.has(tappedKey) || lessonDay?.dayNumber === reviewSource.todaysDay);
  const action: VerseLessonAction | null = reviewFirst
    ? { dayNumber: reviewSource.todaysDay, mode: "select", label: "Review yesterday's verses first" }
    : lessonDay && source
      ? verseLessonAction(lessonDay, source.completedDays, hasCheckpoint)
      : null;
  const canLearnSingleVerse = !reviewFirst && (lessonDay?.newVerses.length ?? 0) > 1 && action?.mode === "select" && activePathScope(source?.pathKey ?? null)?.kind !== "verse";
  return { source, previewVerse, lessonDay, action, canLearnSingleVerse };
}
