const GOSPELS = new Set(["Matthew", "Mark", "Luke", "John"]);

// A more ceremonial display name for the Mind Map's own book node (see
// components/gamification/MindMapCanvas.tsx) — the traditional "Gospel of ___" title for the
// four Gospels, "Book of ___" for everything else. Not attempting to reproduce every book's
// own traditional long title (e.g. "The Acts of the Apostles," "The Revelation to John") —
// those vary by tradition/translation enough that guessing at all 66 risks getting some
// wrong, so this sticks to the one distinction that's genuinely universal.
export function fullBookTitle(book: string): string {
  return GOSPELS.has(book) ? `The Gospel of ${book}` : `The Book of ${book}`;
}
