import type { MemorizedEntity } from "@/types";
import { BIBLE_BOOKS } from "@/lib/bibleBooks";
import { isDue } from "@/lib/srs";

function bookOrder(name: string): number {
  const index = BIBLE_BOOKS.findIndex((book) => book.name === name);
  return index === -1 ? BIBLE_BOOKS.length : index;
}

// Every SRS range due right now, in Bible order (book, chapter, first verse) — the order the
// Mind Map's "Review due" run walks them in (see MindMapReviewDueButton.tsx), so the camera
// travels forward through Scripture rather than jumping back and forth.
export function dueEntitiesInOrder(entities: MemorizedEntity[], now: Date = new Date()): MemorizedEntity[] {
  return entities
    .filter((entity) => isDue(entity.srs, now))
    .sort((a, b) => bookOrder(a.book) - bookOrder(b.book) || a.chapter - b.chapter || a.startVerse - b.startVerse);
}
