"use client";

import { resolveEntity } from "@/lib/memorizedEntities";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MemorizationDay } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { useReviewArrival } from "@/lib/useReviewArrival";
import { usePracticeArrival } from "@/lib/usePracticeArrival";
import { palaceHref, trailHref } from "@/lib/readerHref";
import type { PassageReview } from "@/lib/trailReviews";
import type { ChapterLesson } from "@/components/gamification/ChapterPathLesson";

const progressMark = (pathKey: string): string => {
  const plan = useProgressStore.getState().paths[pathKey];
  return `${plan?.completedDays ?? 0}:${plan?.versesIntoDay ?? 0}:${plan?.reviewsDone?.length ?? 0}`;
};

function parsePassage(value: string | null): PassageReview | undefined {
  const match = value?.match(/^(.+)\|(\d+):(\d+)-(\d+)$/);
  return match ? { key: match[1], chapter: Number(match[2]), from: Number(match[3]), to: Number(match[4]) } : undefined;
}

interface ReaderArrivalOptions {
  pathKey: string;
  version: string;
  days: MemorizationDay[];
  openVerse: (book: string, chapter: number, verseNumber: number | null) => void;
  setSheet: (sheet: ChapterLesson) => void;
}

// How the chapter reader is opened onto something to do, once on arrival (lib/readerHref.ts):
// `?review=` a spaced review, `?practiceDay=` a finished lesson's practice, `?learnDay=` a lesson —
// each run in place at its first verse; `?select=` just opens on a verse. Arriving `from=trail`, finishing or closing it goes back
// to the Path tab's trail (`returnToTrail`), with a "Lesson done" toast if the path moved on.
export function useReaderArrivals({ pathKey, version, days, openVerse, setSheet }: ReaderArrivalOptions) {
  const router = useRouter();
  const setFocusVerse = useLessonSessionStore((state) => state.setFocusVerse);
  // Where a lesson begun on the Path tab's trail (or the Palace) goes back to when it's done.
  const [from] = useState(() => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("from")));
  const fromTrail = from === "trail" || from === "palace";
  // Where the path stood on arrival (days, then verses into the next day), to tell if it moved on.
  const completedAtStart = useRef(progressMark(pathKey));

  const startReview = useCallback(
    (entityIds: string[]) => {
      // The range itself, or the bigger one it's since been merged into (resolveEntity).
      const entity = resolveEntity(useProgressStore.getState().memorizedEntities, entityIds[0]);
      if (!entity) return;
      openVerse(entity.book, entity.chapter, entity.startVerse);
      setSheet({ kind: "srs", verseNumber: entity.startVerse, entityIds });
    },
    [openVerse, setSheet],
  );
  const offerVerse = useCallback((book: string, chapter: number, verseNumber: number) => (openVerse(book, chapter, verseNumber), true), [openVerse]);
  useReviewArrival(offerVerse, startReview);

  // `?verse=chapter:verse` runs just that verse of the day (each verse its own lesson);
  // `?passage=key|chapter:from-to` a trail's pericope or chapter review instead.
  const startDay = useCallback(
    (dayNumber: number, mode: "select" | "practice") => {
      const day = days.find((candidate) => candidate.dayNumber === dayNumber);
      const passage = parsePassage(new URLSearchParams(window.location.search).get("passage"));
      if (day && passage && mode === "practice") {
        openVerse(day.newVerses[0]?.book ?? "", passage.chapter, passage.from);
        setSheet({ kind: "lesson", verseNumber: passage.from, dayNumber, mode, passage });
        return;
      }
      const [chapter, verseNumber] = (new URLSearchParams(window.location.search).get("verse") ?? "").split(":").map(Number);
      const only = day?.newVerses.find((verse) => verse.chapter === chapter && verse.verseNumber === verseNumber);
      const first = only ?? (day ? (day.kind === "learn" ? day.newVerses : day.reviewVerses)[0] : undefined);
      if (!first) return;
      openVerse(first.book, first.chapter, first.verseNumber);
      setFocusVerse({ book: first.book, chapter: first.chapter, verseNumber: first.verseNumber });
      setSheet({ kind: "lesson", verseNumber: first.verseNumber, dayNumber, mode, onlyVerse: only ? { chapter: only.chapter, verseNumber: only.verseNumber } : undefined });
    },
    [days, openVerse, setFocusVerse, setSheet],
  );
  usePracticeArrival(useCallback((dayNumber: number) => startDay(dayNumber, "practice"), [startDay]));
  const learnDone = useRef(false);
  useEffect(() => {
    if (learnDone.current) return;
    learnDone.current = true;
    const search = new URLSearchParams(window.location.search);
    const learnDay = Number(search.get("learnDay"));
    if (learnDay > 0) return startDay(learnDay, "select");
    // `?select=chapter:verse` (a pericope opened from the Path map): that verse, selected, nothing started.
    const [chapter, verseNumber] = (search.get("select") ?? "").split(":").map(Number);
    const book = days.find((day) => day.newVerses.length)?.newVerses[0]?.book;
    if (book && chapter > 0 && verseNumber > 0) openVerse(book, chapter, verseNumber);
  }, [startDay, days, openVerse]);

  // Back to the trail after a lesson begun there — true when it navigated.
  const returnToTrail = useCallback(() => {
    if (!fromTrail) return false;
    const moved = progressMark(pathKey) !== completedAtStart.current;
    router.push(`${from === "palace" ? palaceHref(pathKey, version) : trailHref(pathKey, version, "current")}${moved ? "&toast=done" : ""}`);
    return true;
  }, [fromTrail, from, pathKey, version, router]);

  return { returnToTrail };
}
