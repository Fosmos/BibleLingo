import type { MemorizedEntity } from "@/types";
import { boxDisplayNumber, isDue } from "@/lib/srs";

// The Memorized page's Health list (the Organic restyle): every memorized range, grouped and
// ordered three ways. Pure — no React, no store.

export type HealthSort = "due" | "book" | "recent";
export type HealthTone = "due" | "rooted" | "growing" | "book";

export interface HealthGroup {
  key: string;
  label: string;
  tone: HealthTone;
  entities: MemorizedEntity[];
}

// The display box from which a range counts as rooted (Box 4 and up).
const ROOTED_FROM_BOX = 4;
const DAY_MS = 24 * 60 * 60 * 1000;

export function healthTone(entity: MemorizedEntity, now: Date): Exclude<HealthTone, "book"> {
  if (isDue(entity.srs, now)) return "due";
  return boxDisplayNumber(entity.srs.box) >= ROOTED_FROM_BOX ? "rooted" : "growing";
}

// How strong a range is, 0–100: its last review's accuracy, or — before its first review —
// how far up the boxes it sits.
export function healthStrength(entity: MemorizedEntity): number {
  return entity.srs.lastAccuracy ?? boxDisplayNumber(entity.srs.box) * 20;
}

export function healthDueText(entity: MemorizedEntity, now: Date): string {
  if (isDue(entity.srs, now) || !entity.srs.nextDueAt) return "Due now";
  const days = Math.max(1, Math.ceil((new Date(entity.srs.nextDueAt).getTime() - now.getTime()) / DAY_MS));
  return `In ${days} day${days === 1 ? "" : "s"}`;
}

const dueTime = (entity: MemorizedEntity) => (entity.srs.nextDueAt ? new Date(entity.srs.nextDueAt).getTime() : 0);
const reviewedTime = (entity: MemorizedEntity) => (entity.srs.lastReviewedAt ? new Date(entity.srs.lastReviewedAt).getTime() : 0);
const byPlace = (a: MemorizedEntity, b: MemorizedEntity) => a.chapter - b.chapter || a.startVerse - b.startVerse;

export function groupHealth(entities: MemorizedEntity[], sort: HealthSort, now: Date): HealthGroup[] {
  if (sort === "recent") {
    const ordered = [...entities].sort((a, b) => reviewedTime(b) - reviewedTime(a));
    return ordered.length ? [{ key: "recent", label: "Most recently reviewed", tone: "book", entities: ordered }] : [];
  }
  if (sort === "book") {
    const books = new Map<string, MemorizedEntity[]>();
    for (const entity of entities) books.set(entity.book, [...(books.get(entity.book) ?? []), entity]);
    return Array.from(books.keys())
      .sort((a, b) => a.localeCompare(b))
      .map((book) => ({ key: book, label: book, tone: "book" as const, entities: (books.get(book) ?? []).sort(byPlace) }));
  }
  const groups: HealthGroup[] = [
    { key: "due", label: "Needs review", tone: "due", entities: [] },
    { key: "rooted", label: "Rooted", tone: "rooted", entities: [] },
    { key: "growing", label: "Growing", tone: "growing", entities: [] },
  ];
  for (const entity of entities) groups.find((group) => group.tone === healthTone(entity, now))?.entities.push(entity);
  for (const group of groups) group.entities.sort((a, b) => dueTime(a) - dueTime(b));
  return groups.filter((group) => group.entities.length > 0);
}
