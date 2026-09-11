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
  return allDays.filter((candidate) => candidate.chapterGroup === activeDay.chapterGroup);
}
