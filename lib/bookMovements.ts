import { findBook } from "@/lib/bibleBooks";
import { BOOK_THEMES } from "@/lib/bookThemes";

export interface BookMovement {
  title: string;
  chapters: number[];
  // "1–12"
  range: string;
}

const span = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, index) => start + index);

// A book's movements for the Bible browser — its literary sections (lib/bookThemes.ts), or one
// "The whole book" movement for a book without an outline.
export function bookMovements(book: string): BookMovement[] {
  const themes = BOOK_THEMES[book];
  if (themes?.length) {
    return themes.map((theme) => ({
      title: theme.label,
      chapters: span(theme.startChapter, theme.endChapter),
      range: theme.startChapter === theme.endChapter ? `${theme.startChapter}` : `${theme.startChapter}–${theme.endChapter}`,
    }));
  }
  const count = findBook(book)?.chapterCount ?? 1;
  return [{ title: "The whole book", chapters: span(1, count), range: count === 1 ? "1" : `1–${count}` }];
}
