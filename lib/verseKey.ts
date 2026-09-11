// Shared key format for per-verse data keyed by book+chapter+verse (types/index.ts's
// UserProgress.versePOA) — one place so every read/write site agrees on it.
export function verseKey(book: string, chapter: number, verseNumber: number): string {
  return `${book}|${chapter}|${verseNumber}`;
}

export interface ParsedVerseKey {
  book: string;
  chapter: number;
  verseNumber: number;
}

// The other direction of verseKey above — used by StumbleMapsSection.tsx to recover which
// verse each UserProgress.wordStumbleCounts entry belongs to. Book names never contain "|",
// so a plain split is exact, no escaping needed.
export function parseVerseKey(key: string): ParsedVerseKey {
  const [book, chapterText, verseNumberText] = key.split("|");
  return { book, chapter: Number(chapterText), verseNumber: Number(verseNumberText) };
}
