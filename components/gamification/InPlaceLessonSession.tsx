"use client";

import { useCallback, useMemo } from "react";
import type { MemorizationDay, VerseSegment } from "@/types";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { useProgressStore } from "@/store/useProgressStore";
import type { PassageReview } from "@/lib/trailReviews";
import { resolveCompletingChapterVerses } from "@/lib/completingChapterVerses";
import { singleVerseDay, verseIndexInDay } from "@/lib/dayVerseProgress";
import { useChapterScopedReadingLayout } from "@/lib/useChapterScopedReadingLayout";
import { useEmbeddedSenseCardOverride } from "@/lib/useEmbeddedSenseCardOverride";
import { DaySessionController } from "@/components/gamification/DaySessionController";
import { PracticeChain } from "@/components/drills/PracticeChain";
import { EsvAttribution } from "@/components/ui/EsvAttribution";

// A stable placeholder so useChapterScopedReadingLayout (a hook — can't be called after the
// `!day` early return below) always has a real MemorizationDay to key off of, even on the one
// render where `dayNumber` doesn't actually match anything in `days` — its own resulting
// layout is simply never used in that case, since the component returns null right after.
const FALLBACK_DAY: MemorizationDay = { dayNumber: -1, kind: "learn", newVerses: [], reviewVerses: [] };

interface InPlaceLessonSessionProps {
  pathKey: string;
  label: string;
  days: MemorizationDay[];
  verses: VerseSegment[];
  version: string;
  // This whole PATH's own completedDays/todaysDay — not scoped to just this one lesson day —
  // threaded down to DaySessionController so its own parchment can lay out against the SAME
  // real chapter pages/uniform font size the reading view underneath it just showed (see
  // lib/useChapterReadingLayout.ts), rather than a smaller, differently-sized excerpt.
  completedDays: number;
  todaysDay: number;
  dayNumber: number;
  mode: "select" | "practice";
  // Just this verse of the day — each verse is its own lesson (lib/dayVerseProgress.ts).
  onlyVerse?: { chapter: number; verseNumber: number };
  // A trail's pericope or chapter review (practice only): those verses, marked done when finished.
  passage?: PassageReview;
  // Set only by BookMindMapWithLessonSheet.tsx's own bottom-sheet trigger — threaded straight
  // through to LearnSection.tsx's own per-verse chrome (see LearnVerseSpotlightChrome.tsx),
  // which uses it to skip its own small embedded Mind Map preview (the REAL canvas already
  // shows behind/above this sheet) and instead report the live drilled verse back up via
  // store/useLessonSessionStore.ts's `focusVerse`, so the real canvas can zoom to it.
  embeddedInMindMap?: boolean;
  onExit: () => void;
}

// PathOverviewScreen.tsx's own in-place lesson/practice session — rendered right there,
// still mounted under the same parchment view it was reached from, instead of navigating to
// the standalone `/day/[dayNumber]`(`/practice`) routes DayLoader.tsx/PracticeLoader.tsx
// still serve as a fallback (a bookmarked or shared link, say). `onExit` is the one way back:
// it just clears PathOverviewScreen's own lessonDay state, so the exact same parchment view
// reappears underneath rather than a browser-history "back" landing somewhere else entirely.
export function InPlaceLessonSession({ pathKey, label, days, verses, version, completedDays, todaysDay, dayNumber, mode, onlyVerse, passage, embeddedInMindMap, onExit }: InPlaceLessonSessionProps) {
  const completeTrailReview = useProgressStore((state) => state.completeTrailReview);
  const fullDay = days.find((candidate) => candidate.dayNumber === dayNumber);
  const index = fullDay && onlyVerse ? verseIndexInDay(fullDay, onlyVerse.chapter, onlyVerse.verseNumber) : -1;
  // Memoized: a new day (or part) object every render re-runs everything keyed on it, in a loop.
  const day = useMemo(() => (fullDay && index >= 0 ? singleVerseDay(fullDay, fullDay.newVerses[index]) : fullDay), [fullDay, index]);
  const count = fullDay?.newVerses.length ?? 0;
  const dayPart = useMemo(() => (index >= 0 && count > 1 ? { index, count } : undefined), [index, count]);
  const setFocusVerse = useLessonSessionStore((state) => state.setFocusVerse);
  const setLessonProgress = useLessonSessionStore((state) => state.setLessonProgress);
  // Review in the Mind Map sheet: same progress bar and canvas-follows-the-verse behavior a Learn
  // lesson gets from LearnTopBar.tsx/LearnVerseSpotlightChrome.tsx.
  const reportPracticeVerse = useCallback(
    (verse: VerseSegment, fraction: number) => {
      setFocusVerse({ book: verse.book, chapter: verse.chapter, verseNumber: verse.verseNumber });
      setLessonProgress(fraction);
    },
    [setFocusVerse, setLessonProgress],
  );
  // Called unconditionally, alongside every other hook here, since hooks can't be called
  // after an early return — see FALLBACK_DAY's own doc comment.
  const [senseCardFillHeightPx, senseCardColumnWidthPx] = useEmbeddedSenseCardOverride(embeddedInMindMap);
  const layout = useChapterScopedReadingLayout(days, day ?? FALLBACK_DAY, completedDays, todaysDay, senseCardFillHeightPx, senseCardColumnWidthPx);
  if (!day) return null;

  if (mode === "practice") {
    // Matches whichever button got the reader here — DayCircle.tsx's Practice (boss battles)
    // or Review (a completed learn lesson's own verses) — see PracticeLoader.tsx's own
    // identical logic, which this mirrors for the standalone-route fallback. See
    // PracticeChain.tsx's own doc comment on why Review always drills first-letter while
    // Practice stays full-word.
    const practiceVerses = passage
      ? verses.filter((verse) => verse.chapter === passage.chapter && verse.verseNumber >= passage.from && verse.verseNumber <= passage.to && verse.text.trim().length > 0)
      : day.newVerses.length > 0
        ? day.newVerses
        : day.reviewVerses;
    if (practiceVerses.length === 0) return null;
    const isReview = day.kind === "learn" || passage !== undefined;
    const drillLabel = isReview ? "Review" : "Practice";
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
        <PracticeChain
          verses={practiceVerses}
          label={drillLabel}
          mode={isReview ? "firstLetter" : "fullWord"}
          onExit={onExit}
          sessionKey={`${pathKey}:${dayNumber}:practice${passage ? `:${passage.key}` : index >= 0 ? `:${index}` : ""}`}
          layout={layout}
          exitWhenDone={embeddedInMindMap}
          onVerseChange={embeddedInMindMap ? reportPracticeVerse : undefined}
          onDone={passage ? () => completeTrailReview(pathKey, passage.key) : undefined}
        />
      </div>
    );
  }

  return (
    <>
      <DaySessionController
        pathKey={pathKey}
        label={label}
        day={day}
        allDays={days}
        completedDays={completedDays}
        todaysDay={todaysDay}
        totalDays={days.length}
        completingChapterVerses={resolveCompletingChapterVerses(fullDay ?? day, days, verses)}
        dayPart={dayPart}
        embeddedInMindMap={embeddedInMindMap}
        onExit={onExit}
      />
      <EsvAttribution visible={version === "ESV"} />
    </>
  );
}
