import type { MemorizedEntity } from "@/types";
import { BIBLE_BOOKS } from "@/lib/bibleBooks";
import { boxDisplayNumber, isDue } from "@/lib/srs";
import { healthTone } from "@/lib/memorizedHealth";
import { formatVerseSpanLabel } from "@/lib/chapterContent";

// The Memorized tab's count-first overview (design option 4b): the hero's milestone goal, and the
// Due / Books / All lists under it. Pure — no React, no store.

const DAY_MS = 24 * 60 * 60 * 1000;
export const MILESTONES = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 31102];

export type RowTone = "due" | "rooted" | "growing";

export interface LibraryRow {
  entity: MemorizedEntity;
  label: string;
  verseCount: number;
  tone: RowTone;
  // Its spaced-review seal, 1–6 by box (lib/srsSeals.ts).
  seal: number;
  // "Overdue 2 days" / "Due today" / "Tomorrow" / "In 9 days".
  dueText: string;
  daysUntil: number;
}

export interface LibraryBook {
  book: string;
  verseCount: number;
  rows: LibraryRow[];
  dueCount: number;
}

export interface Milestone {
  value: number;
  reached: boolean;
}

export function verseCount(entity: MemorizedEntity): number {
  return entity.endVerse - entity.startVerse + 1;
}

// The next milestone above the current total, and the four chips shown around it in the hero —
// the two most recent reached plus the next two ahead.
export function milestoneView(total: number): { goal: number; toGo: number; pct: number; chips: Milestone[] } {
  const nextIndex = Math.max(0, MILESTONES.findIndex((value) => value > total));
  const goal = MILESTONES[nextIndex] ?? MILESTONES[MILESTONES.length - 1];
  const start = Math.max(0, Math.min(nextIndex - 2, MILESTONES.length - 4));
  return {
    goal,
    toGo: Math.max(0, goal - total),
    pct: Math.min(100, Math.round((total / goal) * 100)),
    chips: MILESTONES.slice(start, start + 4).map((value) => ({ value, reached: value <= total })),
  };
}

// Negative when late, 0 when due today, positive days ahead otherwise.
export function daysUntilDue(entity: MemorizedEntity, now: Date): number {
  if (!entity.srs.nextDueAt) return 0;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const due = new Date(entity.srs.nextDueAt);
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const days = Math.round((startOfDue - startOfToday) / DAY_MS);
  return isDue(entity.srs, now) ? Math.min(0, days) : Math.max(1, days);
}

export function dueText(days: number): string {
  if (days < 0) return `Overdue ${-days} day${days === -1 ? "" : "s"}`;
  if (days === 0) return "Due today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

export function toRow(entity: MemorizedEntity, now: Date): LibraryRow {
  const days = daysUntilDue(entity, now);
  return {
    entity,
    label: formatVerseSpanLabel(entity.book, entity.chapter, entity.startVerse, entity.endVerse),
    verseCount: verseCount(entity),
    tone: healthTone(entity, now),
    seal: Math.max(1, boxDisplayNumber(entity.srs.box)),
    dueText: dueText(days),
    daysUntil: days,
  };
}

const bookOrder = (name: string) => {
  const index = BIBLE_BOOKS.findIndex((book) => book.name === name);
  return index === -1 ? BIBLE_BOOKS.length : index;
};
const byPlace = (a: MemorizedEntity, b: MemorizedEntity) =>
  bookOrder(a.book) - bookOrder(b.book) || a.chapter - b.chapter || a.startVerse - b.startVerse;

// Due tab: most overdue first.
export function dueRows(entities: MemorizedEntity[], now: Date): LibraryRow[] {
  return entities
    .filter((entity) => isDue(entity.srs, now))
    .map((entity) => toRow(entity, now))
    .sort((a, b) => a.daysUntil - b.daysUntil || byPlace(a.entity, b.entity));
}

// Books tab: one group per book in Bible order, its ranges in chapter/verse order.
export function libraryBooks(entities: MemorizedEntity[], now: Date): LibraryBook[] {
  const books = new Map<string, MemorizedEntity[]>();
  for (const entity of entities) books.set(entity.book, [...(books.get(entity.book) ?? []), entity]);
  return Array.from(books.entries())
    .sort(([a], [b]) => bookOrder(a) - bookOrder(b))
    .map(([book, list]) => {
      const rows = [...list].sort(byPlace).map((entity) => toRow(entity, now));
      return {
        book,
        rows,
        verseCount: rows.reduce((sum, row) => sum + row.verseCount, 0),
        dueCount: rows.filter((row) => row.tone === "due").length,
      };
    });
}

// All tab: every range in Bible order.
export function allRows(entities: MemorizedEntity[], now: Date): LibraryRow[] {
  return [...entities].sort(byPlace).map((entity) => toRow(entity, now));
}

// A rough review length — a little over a minute a range (same as NeedsReviewingCard.tsx).
export const reviewMinutes = (ranges: number) => Math.max(1, Math.round(ranges * 1.3));
