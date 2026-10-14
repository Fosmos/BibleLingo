import { BIBLE_BOOKS } from "@/lib/bibleBooks";

export interface ChapterRef {
  book: string;
  chapter: number;
}

// The chapter just before or after one, running across book boundaries (Titus 3 → Philemon 1);
// null past Genesis 1 or Revelation 22.
export function adjacentChapter(book: string, chapter: number, step: 1 | -1): ChapterRef | null {
  const index = BIBLE_BOOKS.findIndex((candidate) => candidate.name === book);
  if (index === -1) return null;
  const next = chapter + step;
  if (next >= 1 && next <= BIBLE_BOOKS[index].chapterCount) return { book, chapter: next };
  const neighbour = BIBLE_BOOKS[index + step];
  if (!neighbour) return null;
  return { book: neighbour.name, chapter: step === 1 ? 1 : neighbour.chapterCount };
}
