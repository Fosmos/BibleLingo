"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MemorizationDay } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { useReviewArrival } from "@/lib/useReviewArrival";
import { usePracticeArrival } from "@/lib/usePracticeArrival";
import { trailHref } from "@/lib/readerHref";
import type { ChapterLesson } from "@/components/gamification/ChapterPathLesson";

const progressMark = (pathKey: string): string => {
  const plan = useProgressStore.getState().paths[pathKey];
  return `${plan?.completedDays ?? 0}:${plan?.versesIntoDay ?? 0}`;
};

interface ReaderArrivalOptions {
  pathKey: string;
  version: string;
  days: MemorizationDay[];
  openVerse: (book: string, chapter: number, verseNumber: number | null) => void;
  setSheet: (sheet: ChapterLesson) => void;
}

// How the chapter reader is opened onto something to do, once on arrival (lib/readerHref.ts):
// `?review=` a spaced review, `?practiceDay=` a finished lesson's practice, `?learnDay=` a lesson —
// each run in place at its first verse. Arriving `from=trail`, finishing or closing it goes back
// to the Path tab's trail (`returnToTrail`), with a "Lesson done" toast if the path moved on.
export function useReaderArrivals({ pathKey, version, days, openVerse, setSheet }: ReaderArrivalOptions) {
  const router = useRouter();
  const setFocusVerse = useLessonSessionStore((state) => state.setFocusVerse);
  const [fromTrail] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("from") === "trail");
  // Where the path stood on arrival (days, then verses into the next day), to tell if it moved on.
  const completedAtStart = useRef(progressMark(pathKey));

  const startReview = useCallback(
    (entityIds: string[]) => {
      const entity = useProgressStore.getState().memorizedEntities.find((candidate) => candidate.id === entityIds[0]);
      if (!entity) return;
      openVerse(entity.book, entity.chapter, entity.startVerse);
      setSheet({ kind: "srs", verseNumber: entity.startVerse, entityIds });
    },
    [openVerse, setSheet],
  );
  const offerVerse = useCallback((book: string, chapter: number, verseNumber: number) => (openVerse(book, chapter, verseNumber), true), [openVerse]);
  useReviewArrival(offerVerse, startReview);

  // `?verse=chapter:verse` runs just that verse of the day (each verse its own lesson).
  const startDay = useCallback(
    (dayNumber: number, mode: "select" | "practice") => {
      const day = days.find((candidate) => candidate.dayNumber === dayNumber);
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
    const learnDay = Number(new URLSearchParams(window.location.search).get("learnDay"));
    if (learnDay > 0) startDay(learnDay, "select");
  }, [startDay]);

  // Back to the trail after a lesson begun there — true when it navigated.
  const returnToTrail = useCallback(() => {
    if (!fromTrail) return false;
    const moved = progressMark(pathKey) !== completedAtStart.current;
    router.push(`${trailHref(pathKey, version)}${moved ? "&toast=done" : ""}`);
    return true;
  }, [fromTrail, pathKey, version, router]);

  return { returnToTrail };
}
