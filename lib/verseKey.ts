// Shared key format for per-verse data keyed by book+chapter+verse (types/index.ts's
// UserProgress.versePOA) — one place so every read/write site agrees on it.
export function verseKey(book: string, chapter: number, verseNumber: number): string {
  return `${book}|${chapter}|${verseNumber}`;
}
