import type { MemorizationDay } from "@/types";

// Book mode's own `allDays` spans the WHOLE book, every chapter's days together (see
// DaySessionController.tsx's own doc comment) — DayPathDiagram.tsx already narrows this down
// to just the currently-viewed chapter's own days before ever computing pagination (see
// lib/bookChapterView.ts's resolveBookChapterView) so a reading-view page only ever fits one
// chapter's own verses onto it. LearnSection.tsx needs the SAME scoping before calling
// lib/useChapterReadingLayout.ts — every day sharing `activeDay.chapterGroup` (undefined, and
// so matching every other day, for every non-book path kind — an exact no-op there). Skipping
// this left Learn trying to paginate/segment the ENTIRE BOOK as one blob: hugely wrong page
// breaks, and pericope headings that silently, permanently vanished the moment any one chapter
// ANYWHERE in the book failed to have cached heading data, not just this lesson's own chapter.
export function chapterScopedDays(allDays: MemorizationDay[], activeDay: MemorizationDay): MemorizationDay[] {
  if (activeDay.chapterGroup === undefined) return allDays.filter((candidate) => candidate.chapterGroup === undefined);
  return daysInChapter(allDays, activeDay.chapterGroup);
}

// One chapter's days in a book plan, now that a lesson can run across a chapter boundary: every
// learn day with verses in `chapter`, trimmed to just those verses (so the end of chapter 1 and
// the start of chapter 2 each show under their own chapter), plus the review days tagged to it.
export function daysInChapter(allDays: MemorizationDay[], chapter: number): MemorizationDay[] {
  return allDays.flatMap((day) => {
    if (day.kind !== "learn" || day.newVerses.length === 0) return day.chapterGroup === chapter ? [day] : [];
    const own = day.newVerses.filter((verse) => verse.chapter === chapter);
    if (own.length === 0) return [];
    return own.length === day.newVerses.length ? [day] : [{ ...day, newVerses: own }];
  });
}

// Every chapter a plan's days touch — the chapters its learn days' verses fall in, and the ones
// its review days are tagged to — in order.
export function planChapters(allDays: MemorizationDay[]): number[] {
  const chapters = new Set<number>();
  for (const day of allDays) {
    if (day.chapterGroup !== undefined) chapters.add(day.chapterGroup);
    if (day.kind === "learn") for (const verse of day.newVerses) chapters.add(verse.chapter);
  }
  return [...chapters].sort((a, b) => a - b);
}
