"use client";

import { useCallback, useState, type ReactNode } from "react";
import type { MemorizationDay, VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { isDue } from "@/lib/srs";
import { useVerseMemory } from "@/lib/useVerseMemory";
import type { VerseStatus } from "@/lib/readerVerseStatus";
import { versePathLesson } from "@/lib/versePathLesson";
import { useBibleZoom } from "@/lib/useBibleZoom";
import { useHideTabBarWhile } from "@/lib/useHideTabBarWhile";
import { useReaderArrivals } from "@/lib/useReaderArrivals";
import { findVerseLessonDay } from "@/lib/verseLessonAction";
import { BibleProgressLevel } from "@/components/gamification/BibleProgressLevel";
import { BookProgressLevel } from "@/components/gamification/BookProgressLevel";
import { ChapterSenseReader } from "@/components/gamification/ChapterSenseReader";
import type { ParsedVerseKey } from "@/lib/verseKey";
import { ChapterPathLesson, type ChapterLesson } from "@/components/gamification/ChapterPathLesson";
import { MindMapSheetBreadcrumb } from "@/components/gamification/MindMapSheetBreadcrumb";
import type { ProgressFilter } from "@/lib/bibleProgress";

interface ChapterPathScreenProps {
  pathKey: string;
  label: string;
  days: MemorizationDay[];
  verses: VerseSegment[];
  version: string;
  completedDays: number;
  todaysDay: number;
  // Open straight into the next lesson (a single-verse path's "Learn just vN").
  autoStartLesson?: boolean;
  // The chapter to open on, when not the path's own (the /review screen has no path of its own).
  startAt?: { book: string; chapter: number };
  // Open on the whole-Bible circles rather than a chapter (the Memorized tab with no path yet).
  startOnBible?: boolean;
  // Shown under the Bible level's books (the Memorized tab's "Where you stumble").
  bibleFooter?: ReactNode;
}

// The Memorized tab (design_handoff_bible_progress): the whole Bible as circles, a book's chapters
// as circles, and chapters in sense lines — opening on your next verse's chapter. Lessons and
// reviews run in place in the verse's own row, controls docked below.
export function ChapterPathScreen({ pathKey, label, days, verses, version, completedDays, todaysDay, autoStartLesson, startAt, startOnBible, bibleFooter }: ChapterPathScreenProps) {
  const memory = useVerseMemory();
  const entities = useProgressStore((state) => state.memorizedEntities);
  const setFocusVerse = useLessonSessionStore((state) => state.setFocusVerse);
  const focusVerse = useLessonSessionStore((state) => state.focusVerse);
  const clearFocusVerse = useLessonSessionStore((state) => state.clearFocusVerse);
  const setLessonProgress = useLessonSessionStore((state) => state.setLessonProgress);
  // Each verse of a day is its own lesson: the next one up is past the day's learned verses.
  const versesIntoDay = useProgressStore((state) => state.paths[pathKey]?.versesIntoDay ?? 0);
  const nextDay = days.find((day) => day.kind === "learn" && day.dayNumber > completedDays);
  const current = nextDay?.newVerses[nextDay.dayNumber === completedDays + 1 ? versesIntoDay : 0] ?? nextDay?.newVerses[0];
  const only = (verse: { chapter: number; verseNumber: number }) => ({ chapter: verse.chapter, verseNumber: verse.verseNumber });
  const pathBook = verses[0]?.book ?? "";
  const zoom = useBibleZoom(startAt ?? { book: pathBook, chapter: current?.chapter ?? verses[0]?.chapter ?? 1 }, startOnBible ? 0 : 2);
  const [selected, setSelected] = useState<ParsedVerseKey | null>(current ? { book: current.book, chapter: current.chapter, verseNumber: current.verseNumber } : null);
  const [filter, setFilter] = useState<ProgressFilter>("all");
  // Bumped on every jump to a chapter (not scrolling on into one), so the reader starts over from it.
  const [jumps, setJumps] = useState(0);
  const [sheet, setSheet] = useState<ChapterLesson | null>(() =>
    autoStartLesson && nextDay && current ? { kind: "lesson", verseNumber: current.verseNumber, dayNumber: nextDay.dayNumber, mode: "select", onlyVerse: only(current) } : null,
  );
  useHideTabBarWhile(sheet !== null);

  const { openChapter } = zoom;
  const openVerse = useCallback(
    (book: string, chapter: number, verseNumber: number | null) => {
      openChapter(book, chapter);
      setSelected(verseNumber === null ? null : { book, chapter, verseNumber });
      setJumps((count) => count + 1);
    },
    [openChapter],
  );

  function closeLesson() {
    // Stay on the chapter (and verse) the lesson finished in — or, begun on the trail, go back there.
    const last = useLessonSessionStore.getState().focusVerse;
    clearFocusVerse();
    setLessonProgress(null);
    setSheet(null);
    if (returnToTrail()) return;
    if (last) openVerse(last.book, last.chapter, last.verseNumber);
  }

  // Arriving to do something (a review, a practice, a lesson from the trail) — lib/useReaderArrivals.ts.
  const { returnToTrail } = useReaderArrivals({ pathKey, version, days, openVerse, setSheet });

  const statusOf = (book: string, chapter: number, verseNumber: number): VerseStatus => {
    const state = memory.stateOf(book, chapter, verseNumber);
    return state === "open" && current?.book === book && current.chapter === chapter && current.verseNumber === verseNumber ? "current" : state;
  };
  const covering = (book: string, chapter: number, verseNumber: number) =>
    entities.filter((entity) => entity.book === book && entity.chapter === chapter && verseNumber >= entity.startVerse && verseNumber <= entity.endVerse);

  function handleAction(verse: VerseSegment, status: VerseStatus) {
    setFocusVerse({ book: verse.book, chapter: verse.chapter, verseNumber: verse.verseNumber });
    const verseNumber = verse.verseNumber;
    const day = verse.book === pathBook ? findVerseLessonDay(days, verse.chapter, verseNumber) : undefined;
    if (status === "due" || status === "rooted" || status === "growing") {
      // A verse in several ranges (one added by hand, one from a path) reviews every DUE one — the
      // first range found may not be the one that's due, which would leave the verse marked due.
      const ranges = covering(verse.book, verse.chapter, verseNumber);
      const due = ranges.filter((entity) => isDue(entity.srs));
      const ids = (due.length ? due : ranges.slice(0, 1)).map((entity) => entity.id);
      if (ids.length) return setSheet({ kind: "srs", verseNumber, entityIds: ids });
      if (day && day.dayNumber <= completedDays + 1) return setSheet({ kind: "lesson", verseNumber, dayNumber: day.dayNumber, mode: "practice", onlyVerse: only(verse) });
    }
    if (status === "current" && day) return setSheet({ kind: "lesson", verseNumber, dayNumber: day.dayNumber, mode: "select", onlyVerse: only(verse) });
    // Known but with no review or lesson to run here: read and listen to it.
    if (status !== "open" && status !== "current") return setSheet({ kind: "preview", verseNumber, verse });
    // Learn on a verse that isn't the path's next one: that verse as a path of its own, learned right here.
    const own = versePathLesson(verse, version);
    if (own) setSheet({ kind: "lesson", verseNumber, dayNumber: own.dayNumber, mode: "select", page: own.page });
  }

  const { place } = zoom;
  return (
    <div className={`flex h-[100dvh] w-full flex-col ${sheet ? "" : "-mb-28"}`}>
      {/* A lesson takes the screen as a page of its own (PathLessonPage.tsx); the reader comes back after. */}
      <div className={`relative min-h-0 flex-1 overflow-hidden ${sheet ? "hidden" : ""}`}>
        {zoom.level === 0 && <BibleProgressLevel filter={filter} onFilter={setFilter} hereBook={pathBook} onOpenBook={zoom.openBook} footer={bibleFooter} />}
        {zoom.level === 1 && (
          <BookProgressLevel
            book={place.book}
            filter={filter}
            onFilter={setFilter}
            hereChapter={place.book === current?.book ? current.chapter : null}
            onBible={zoom.toBible}
            onOpenChapter={(inChapter) => openVerse(place.book, inChapter, current?.book === place.book && current.chapter === inChapter ? current.verseNumber : null)}
          />
        )}
        {zoom.level === 2 && (
          <ChapterSenseReader
            key={`${place.book}|${place.chapter}|${jumps}`}
            start={place}
            version={version}
            pathVerses={verses}
            statusOf={statusOf}
            selected={selected}
            onSelect={setSelected}
            onAction={handleAction}
            onBible={zoom.toBible}
            onBook={zoom.openBook}
            lessonRange={current ? [current] : []}
          />
        )}
      </div>
      {sheet && (
        <ChapterPathLesson lesson={sheet} page={(sheet.kind === "lesson" && sheet.page) || { pathKey, label, days, verses, version, completedDays, todaysDay }} onClose={closeLesson} />
      )}
      {sheet && focusVerse && (
        <MindMapSheetBreadcrumb book={focusVerse.book} chapter={focusVerse.chapter} verseNumber={focusVerse.verseNumber} onExit={closeLesson} />
      )}
    </div>
  );
}
