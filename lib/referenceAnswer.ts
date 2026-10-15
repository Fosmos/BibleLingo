import type { VerseSegment } from "@/types";
import { BIBLE_BOOKS } from "@/lib/bibleBooks";

// After each recall stage of a Learn lesson the reader also gives the verse's reference
// (components/gamification/LearnReferenceStep.tsx) — its book, chapter and verse, entered the way
// that stage is entered: tapped from a word bank, typed (the book's first letter, then the
// numbers), or said aloud.
export type ReferenceMode = "bank" | "letters" | "speak";
export type ReferencePart = "book" | "chapter" | "verse";
export const REFERENCE_PARTS: ReferencePart[] = ["book", "chapter", "verse"];

export interface ReferenceAnswer {
  book: string;
  chapter: string;
  verse: string;
}

export const referenceAnswer = (verse: VerseSegment): ReferenceAnswer => ({ book: verse.book, chapter: String(verse.chapter), verse: String(verse.verseNumber) });

// The book's first letter, the way a first-letter stage asks for a word ("1 John" → "J").
export const bookLetter = (book: string): string => (book.match(/[A-Za-z]/)?.[0] ?? "").toLowerCase();

// Word-bank choices for one part: the answer and three near it (neighbouring books; numbers a
// little either side), shuffled steadily by the answer so they don't jump about on re-render.
export function bankChoices(part: ReferencePart, answer: ReferenceAnswer): string[] {
  const options = new Set<string>([answer[part]]);
  if (part === "book") {
    const at = Math.max(0, BIBLE_BOOKS.findIndex((book) => book.name === answer.book));
    for (const step of [1, -1, 2, -2, 3, -3, 4]) {
      const book = BIBLE_BOOKS[at + step];
      if (book && options.size < 4) options.add(book.name);
    }
  } else {
    const value = Number(answer[part]);
    for (const step of [1, -1, 2, 3, -2, 4, 5]) if (value + step >= 1 && options.size < 4) options.add(String(value + step));
  }
  const seed = answer.chapter.length + Number(answer.verse);
  return [...options].sort((a, b) => ((a.charCodeAt(0) + seed) % 7) - ((b.charCodeAt(0) + seed) % 7) || a.localeCompare(b));
}

const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, to: 2, too: 2, three: 3, four: 4, for: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

// The numbers in a spoken transcript, in order — "eight two" or "8:2" or "chapter twenty one
// verse 3" → [8, 2] / [8, 2] / [21, 3]; "a hundred and nineteen" style counts are summed.
export function spokenNumbers(transcript: string): number[] {
  const numbers: number[] = [];
  let pending: number | null = null;
  const flush = () => {
    if (pending !== null) numbers.push(pending);
    pending = null;
  };
  for (const token of transcript.toLowerCase().replace(/[:.,-]/g, " ").split(/\s+/).filter(Boolean)) {
    if (/^\d+$/.test(token)) {
      flush();
      numbers.push(Number(token));
    } else if (token === "hundred") pending = (pending ?? 1) * 100;
    else if (token in NUMBER_WORDS) {
      const value = NUMBER_WORDS[token];
      // "twenty one" joins; "eight two" doesn't.
      if (pending !== null && pending % 10 === 0 && pending > 0 && value < 10) pending += value;
      else if (pending !== null && pending >= 100 && value < 100) pending += value;
      else {
        flush();
        pending = value;
      }
    } else if (token !== "and") flush();
  }
  flush();
  return numbers;
}

// Whether a spoken reference has the book (by its first letter, as the speech stages grade) and
// the chapter then the verse.
export function spokenReferenceMatches(transcript: string, answer: ReferenceAnswer): { book: boolean; chapter: boolean; verse: boolean } {
  const words = transcript.toLowerCase().split(/\s+/).filter((word) => /[a-z]/.test(word));
  const book = words.some((word) => word.startsWith(bookLetter(answer.book)));
  const numbers = spokenNumbers(transcript);
  const chapterAt = numbers.indexOf(Number(answer.chapter));
  return { book, chapter: chapterAt >= 0, verse: chapterAt >= 0 && numbers.slice(chapterAt + 1).includes(Number(answer.verse)) };
}
