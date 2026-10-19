"use client";

import type { MemorizationDay, MemorizedEntity } from "@/types";
import type { ParsedVerseKey } from "@/lib/verseKey";
import type { ChapterLesson } from "@/components/gamification/ChapterPathLesson";
import { TEACHING_STAGE_LABELS } from "@/lib/learnSheetStage";
import { BIBLE_BOOKS } from "@/lib/bibleBooks";
import { useRecalledVerses } from "@/lib/useRecalledVerses";

interface LessonVerseVisibilityOptions {
  sheet: ChapterLesson | null;
  stageLabel: string | undefined;
  entities: MemorizedEntity[];
  days: MemorizationDay[];
  focusVerse: ParsedVerseKey | null;
  // The chapter the reader is on — where a lesson's verse is before it reports its own.
  place: { book: string; chapter: number };
}

const order = (book: string, chapter: number, verseNumber: number) => [BIBLE_BOOKS.findIndex((entry) => entry.name === book), chapter, verseNumber];

// While a lesson or review runs on the chapter reader (ChapterPathScreen.tsx): the verse it's on
// (whose row holds it), which verses are blank — grey pills (ReaderVerseRow.tsx) — and which,
// already typed or said through, stay in full.
export function useLessonVerseVisibility({ sheet, stageLabel, entities, days, focusVerse, place }: LessonVerseVisibilityOptions) {
  // Reviews (and a lesson's review steps) blank the verses after the drilled one; teaching doesn't.
  const teaching = sheet?.kind === "lesson" && sheet.mode === "select" && stageLabel !== undefined && TEACHING_STAGE_LABELS.has(stageLabel);
  const hidesAhead = sheet !== null && sheet.kind !== "preview" && !teaching;
  const reviewedHere = new Set<string>();
  if (sheet?.kind === "srs") {
    for (const entity of entities.filter((candidate) => sheet.entityIds.includes(candidate.id))) {
      for (let verseNumber = entity.startVerse; verseNumber <= entity.endVerse; verseNumber++) reviewedHere.add(`${entity.book}|${entity.chapter}|${verseNumber}`);
    }
  } else if (sheet?.kind === "lesson" && sheet.mode === "practice") {
    const practised = days.find((day) => day.dayNumber === sheet.dayNumber)?.newVerses.filter((verse) => !sheet.onlyVerse || (verse.chapter === sheet.onlyVerse.chapter && verse.verseNumber === sheet.onlyVerse.verseNumber));
    for (const verse of practised ?? []) reviewedHere.add(`${verse.book}|${verse.chapter}|${verse.verseNumber}`);
  }
  // While a lesson or review runs, the view follows the verse being drilled (lib/useReportFocusVerse.ts).
  const lessonVerse: ParsedVerseKey | null = sheet ? (focusVerse ?? { ...place, verseNumber: sheet.verseNumber }) : null;
  const isAhead = (book: string, chapter: number, verseNumber: number) => {
    if (!lessonVerse) return false;
    const [a, b] = [order(book, chapter, verseNumber), order(lessonVerse.book, lessonVerse.chapter, lessonVerse.verseNumber)];
    return a[0] !== b[0] ? a[0] > b[0] : a[1] !== b[1] ? a[1] > b[1] : a[2] > b[2];
  };
  // A verse the drill has already moved past stays in full, whichever verse it's on now — and a
  // review goes in order, so a verse of its range before the one it's on was typed (even before a resume).
  const recalled = useRecalledVerses(focusVerse ? `${focusVerse.book}|${focusVerse.chapter}|${focusVerse.verseNumber}` : null, sheet !== null && sheet.kind !== "preview");
  const isRecalled = (book: string, chapter: number, verseNumber: number) => {
    const key = `${book}|${chapter}|${verseNumber}`;
    const onIt = lessonVerse?.book === book && lessonVerse.chapter === chapter && lessonVerse.verseNumber === verseNumber;
    return !onIt && !isAhead(book, chapter, verseNumber) && (recalled.has(key) || reviewedHere.has(key));
  };
  const isHidden = (book: string, chapter: number, verseNumber: number) =>
    !isRecalled(book, chapter, verseNumber) && (reviewedHere.has(`${book}|${chapter}|${verseNumber}`) || (hidesAhead && isAhead(book, chapter, verseNumber)));

  return { lessonVerse, isHidden, isRecalled };
}
