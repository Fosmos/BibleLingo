"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { MemorizationDay, VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { isDue } from "@/lib/srs";
import { useVerseMemory } from "@/lib/useVerseMemory";
import { verseRuns } from "@/lib/verseMemoryState";
import { verseRunPathHref, verseRunPathKey } from "@/lib/singleVersePath";
import { useBibleZoom } from "@/lib/useBibleZoom";
import { useHideTabBarWhile } from "@/lib/useHideTabBarWhile";
import { useReviewArrival } from "@/lib/useReviewArrival";
import { usePracticeArrival } from "@/lib/usePracticeArrival";
import { findVerseLessonDay } from "@/lib/verseLessonAction";
import { BibleBreadcrumbs } from "@/components/gamification/BibleBreadcrumbs";
import { BibleZoomLayer } from "@/components/gamification/BibleZoomLayer";
import { BibleShelves } from "@/components/gamification/BibleShelves";
import { ChapterPathLevel } from "@/components/gamification/ChapterPathLevel";
import { ChapterPathLesson, type ChapterLesson } from "@/components/gamification/ChapterPathLesson";
import { MindMapSheetBreadcrumb } from "@/components/gamification/MindMapSheetBreadcrumb";
import type { VerseStatus } from "@/components/gamification/ChapterPathVerseRow";

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
}

// The Path tab for book, chapter and verse paths (shelf_path): shelves of book spines, and each
// chapter as pericope cards opening into the path view, starting on your next verse's chapter. A
// verse's lesson, review or preview runs in its own card, controls docked below (ChapterPathLesson).
export function ChapterPathScreen({ pathKey, label, days, verses, version, completedDays, todaysDay, autoStartLesson }: ChapterPathScreenProps) {
  const router = useRouter();
  const memory = useVerseMemory();
  const entities = useProgressStore((state) => state.memorizedEntities);
  const setPath = useProgressStore((state) => state.setPath);
  const setActivePath = useProgressStore((state) => state.setActivePath);
  const setFocusVerse = useLessonSessionStore((state) => state.setFocusVerse);
  const focusVerse = useLessonSessionStore((state) => state.focusVerse);
  const clearFocusVerse = useLessonSessionStore((state) => state.clearFocusVerse);
  const setLessonProgress = useLessonSessionStore((state) => state.setLessonProgress);
  const nextDay = days.find((day) => day.kind === "learn" && day.dayNumber > completedDays);
  const current = nextDay?.newVerses[0];
  const pathBook = verses[0]?.book ?? "";
  const zoom = useBibleZoom({ book: pathBook, chapter: current?.chapter ?? verses[0]?.chapter ?? 1 });
  const [selected, setSelected] = useState<number | null>(current?.verseNumber ?? null);
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
    setSheet({ kind: "preview", verseNumber, verse });
  }

  // A pericope card's or the action bar's "Review": every due range touching those verses, in place.
  function reviewVerses(picked: number[]) {
    const now = new Date();
    const ids = new Set(picked.flatMap((verseNumber) => covering(verseNumber).filter((entity) => isDue(entity.srs, now)).map((entity) => entity.id)));
    if (ids.size) startReview([...ids]);
  }

  // "Learn N chosen": each run of chosen verses becomes a verse path of its own (Romans 8:5–7), all
  // added to your active paths, and the first opens straight into its lesson.
  function learnVerses(picked: number[]) {
    const keys = verseRuns(picked).map(([start, end]) => verseRunPathKey(book, chapter, start, end));
    if (!keys.length) return;
    keys.slice(1).forEach((key) => {
      setPath(key, version);
      setActivePath(key);
    });
    router.push(verseRunPathHref(keys[0], version));
  }

  // A review — spaced, or a finished lesson's — leaves its own verses empty, and every verse after
  // the one being recited, so nothing on the path gives the answer away.
  const reviewing = sheet?.kind === "srs" || (sheet?.kind === "lesson" && sheet.mode === "practice");
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
  const isHidden = (verseNumber: number) => reviewedHere.has(verseNumber) || (reviewing && lessonVerse !== null && verseNumber > lessonVerse);

  return (
    <div className={`flex h-[100dvh] w-full flex-col ${sheet ? "" : "-mb-28"}`}>
      {!sheet && (
        <BibleBreadcrumbs
          crumbs={["The Bible", `${zoom.place.book} ${zoom.place.chapter}`]}
          level={zoom.level}
          onSelect={(level) => (level === 0 ? zoom.toShelves() : openChapter(zoom.place.book, zoom.place.chapter))}
        />
      )}
      <div data-zoom-stage className="relative min-h-0 flex-1 overflow-hidden">
        <BibleZoomLayer depth={0} level={zoom.level} origin={undefined}>
          <BibleShelves openBook={zoom.openBook} onToggleBook={zoom.setOpenBook} onOpenChapter={(inBook, inChapter) => openVerse(inBook, inChapter, current?.book === inBook && current.chapter === inChapter ? current.verseNumber : null)} />
        </BibleZoomLayer>
        <BibleZoomLayer depth={1} level={zoom.level} origin={undefined} className="flex flex-col">
          {zoom.level === 1 && (
            <ChapterPathLevel
              book={book}
              chapter={chapter}
              version={version}
              pathVerses={verses}
              statusOf={statusOf}
              selected={selected}
              onSelect={setSelected}
              onAction={handleAction}
              onLearn={learnVerses}
              onReview={reviewVerses}
              onBack={zoom.toShelves}
              lessonVerse={lessonVerse}
              isHidden={isHidden}
            />
          )}
        </BibleZoomLayer>
      </div>
      {sheet && <ChapterPathLesson lesson={sheet} page={{ pathKey, label, days, verses, version, completedDays, todaysDay }} onClose={closeLesson} />}
      {sheet && focusVerse && (
        <MindMapSheetBreadcrumb book={focusVerse.book} chapter={focusVerse.chapter} verseNumber={focusVerse.verseNumber} onExit={closeLesson} />
      )}
    </div>
  );
}
