"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { MemorizationDay, VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { useVerseMemory } from "@/lib/useVerseMemory";
import type { VerseStatus } from "@/lib/readerVerseStatus";
import { singleVersePathHref } from "@/lib/singleVersePath";
import { useBibleZoom } from "@/lib/useBibleZoom";
import { useHideTabBarWhile } from "@/lib/useHideTabBarWhile";
import { useReviewArrival } from "@/lib/useReviewArrival";
import { usePracticeArrival } from "@/lib/usePracticeArrival";
import { findVerseLessonDay } from "@/lib/verseLessonAction";
import { BibleProgressLevel } from "@/components/gamification/BibleProgressLevel";
import { BookProgressLevel } from "@/components/gamification/BookProgressLevel";
import { ChapterPathLevel } from "@/components/gamification/ChapterPathLevel";
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
}

// The Path tab for book, chapter and verse paths (design_handoff_bible_progress): the whole Bible as
// circles, a book's chapters as circles, and a chapter in sense lines — opening on your next verse's
// chapter. Lessons and reviews run in place in the verse's own row, controls docked below.
export function ChapterPathScreen({ pathKey, label, days, verses, version, completedDays, todaysDay, autoStartLesson, startAt }: ChapterPathScreenProps) {
  const router = useRouter();
  const memory = useVerseMemory();
  const entities = useProgressStore((state) => state.memorizedEntities);
  const setFocusVerse = useLessonSessionStore((state) => state.setFocusVerse);
  const focusVerse = useLessonSessionStore((state) => state.focusVerse);
  const clearFocusVerse = useLessonSessionStore((state) => state.clearFocusVerse);
  const setLessonProgress = useLessonSessionStore((state) => state.setLessonProgress);
  const nextDay = days.find((day) => day.kind === "learn" && day.dayNumber > completedDays);
  const current = nextDay?.newVerses[0];
  const pathBook = verses[0]?.book ?? "";
  const zoom = useBibleZoom(startAt ?? { book: pathBook, chapter: current?.chapter ?? verses[0]?.chapter ?? 1 });
  const [selected, setSelected] = useState<number | null>(current?.verseNumber ?? null);
  const [filter, setFilter] = useState<ProgressFilter>("all");
  const [sheet, setSheet] = useState<ChapterLesson | null>(() =>
    autoStartLesson && nextDay && current ? { kind: "lesson", verseNumber: current.verseNumber, dayNumber: nextDay.dayNumber, mode: "select" } : null,
  );
  useHideTabBarWhile(sheet !== null);

  const { openChapter } = zoom;
  const openVerse = useCallback(
    (book: string, chapter: number, verseNumber: number | null) => {
      openChapter(book, chapter);
      setSelected(verseNumber);
    },
    [openChapter],
  );

  function closeLesson() {
    // Stay on the chapter (and verse) the lesson finished in.
    const last = useLessonSessionStore.getState().focusVerse;
    if (last) openVerse(last.book, last.chapter, last.verseNumber);
    clearFocusVerse();
    setLessonProgress(null);
    setSheet(null);
  }

  const startReview = useCallback(
    (entityIds: string[]) => {
      const entity = useProgressStore.getState().memorizedEntities.find((candidate) => candidate.id === entityIds[0]);
      if (!entity) return;
      openVerse(entity.book, entity.chapter, entity.startVerse);
      setSheet({ kind: "srs", verseNumber: entity.startVerse, entityIds });
    },
    [openVerse],
  );
  const offerVerse = useCallback((book: string, chapter: number, verseNumber: number) => (openVerse(book, chapter, verseNumber), true), [openVerse]);
  useReviewArrival(offerVerse, startReview);
  // Home's "Review" on today's finished lesson: that lesson's review, in place at its first verse.
  const startPractice = useCallback(
    (dayNumber: number) => {
      const first = days.find((day) => day.dayNumber === dayNumber)?.newVerses[0];
      if (!first) return;
      openVerse(first.book, first.chapter, first.verseNumber);
      setFocusVerse({ book: first.book, chapter: first.chapter, verseNumber: first.verseNumber });
      setSheet({ kind: "lesson", verseNumber: first.verseNumber, dayNumber, mode: "practice" });
    },
    [days, openVerse, setFocusVerse],
  );
  usePracticeArrival(startPractice);

  // While a lesson or review runs, the view follows the verse being drilled (lib/useReportFocusVerse.ts).
  const followed = sheet ? focusVerse : null;
  const book = followed?.book ?? zoom.place.book;
  const chapter = followed?.chapter ?? zoom.place.chapter;
  const statusOf = (verseNumber: number): VerseStatus => {
    const state = memory.stateOf(book, chapter, verseNumber);
    return state === "open" && current?.book === book && current.chapter === chapter && current.verseNumber === verseNumber ? "current" : state;
  };
  const covering = (verseNumber: number) =>
    entities.filter((entity) => entity.book === book && entity.chapter === chapter && verseNumber >= entity.startVerse && verseNumber <= entity.endVerse);

  function handleAction(verse: VerseSegment, status: VerseStatus) {
    setFocusVerse({ book: verse.book, chapter: verse.chapter, verseNumber: verse.verseNumber });
    const verseNumber = verse.verseNumber;
    const day = verse.book === pathBook ? findVerseLessonDay(days, verse.chapter, verseNumber) : undefined;
    if (status === "due" || status === "rooted" || status === "growing") {
      const entity = covering(verseNumber)[0];
      if (entity) return setSheet({ kind: "srs", verseNumber, entityIds: [entity.id] });
      if (day && day.dayNumber <= completedDays) return setSheet({ kind: "lesson", verseNumber, dayNumber: day.dayNumber, mode: "practice" });
    }
    if (status === "current" && day) return setSheet({ kind: "lesson", verseNumber, dayNumber: day.dayNumber, mode: "select" });
    // Known but with no review or lesson to run here: read and listen to it.
    if (status !== "open" && status !== "current") return setSheet({ kind: "preview", verseNumber, verse });
    // Learn on a verse that isn't the path's next one: that verse as a path of its own, straight into its lesson.
    router.push(singleVersePathHref(verse.book, verse.chapter, verseNumber, version));
  }

  // Lessons and reviews (not previews) blank every verse after the drilled one; a review, its range.
  const hidesAhead = sheet !== null && sheet.kind !== "preview";
  const reviewedHere = new Set<number>();
  if (sheet?.kind === "srs") {
    for (const entity of entities.filter((candidate) => sheet.entityIds.includes(candidate.id) && candidate.book === book && candidate.chapter === chapter)) {
      for (let verseNumber = entity.startVerse; verseNumber <= entity.endVerse; verseNumber++) reviewedHere.add(verseNumber);
    }
  } else if (sheet?.kind === "lesson" && sheet.mode === "practice") {
    for (const verse of days.find((day) => day.dayNumber === sheet.dayNumber)?.newVerses ?? []) {
      if (verse.book === book && verse.chapter === chapter) reviewedHere.add(verse.verseNumber);
    }
  }
  const lessonVerse = sheet ? (followed?.verseNumber ?? sheet.verseNumber) : null;
  const isHidden = (verseNumber: number) => reviewedHere.has(verseNumber) || (hidesAhead && lessonVerse !== null && verseNumber > lessonVerse);

  const { place } = zoom;
  return (
    <div className={`flex h-[100dvh] w-full flex-col ${sheet ? "" : "-mb-28"}`}>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {zoom.level === 0 && <BibleProgressLevel filter={filter} onFilter={setFilter} hereBook={pathBook} onOpenBook={zoom.openBook} />}
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
          <ChapterPathLevel
            book={book}
            chapter={chapter}
            version={version}
            pathVerses={verses}
            statusOf={statusOf}
            selected={selected}
            onSelect={setSelected}
            onAction={handleAction}
            onBible={zoom.toBible}
            onBook={zoom.toBook}
            lessonVerse={lessonVerse}
            isHidden={isHidden}
          />
        )}
      </div>
      {sheet && <ChapterPathLesson lesson={sheet} page={{ pathKey, label, days, verses, version, completedDays, todaysDay }} onClose={closeLesson} />}
      {sheet && focusVerse && (
        <MindMapSheetBreadcrumb book={focusVerse.book} chapter={focusVerse.chapter} verseNumber={focusVerse.verseNumber} onExit={closeLesson} />
      )}
    </div>
  );
}
