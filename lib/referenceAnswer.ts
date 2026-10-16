import type { VerseSegment } from "@/types";
import { BIBLE_BOOKS } from "@/lib/bibleBooks";

// Each recall stage of a Learn lesson drills the verse's reference as its opening
// (components/gamification/ReferenceGate.tsx) — its book, chapter and verse, entered the way
// that stage is entered: tapped from a word bank, typed (the book's first letter, then the
// numbers), or said aloud. A numbered book ("1 Corinthians") has its number as a part of its own,
// before the book's name.
export type ReferenceMode = "bank" | "letters" | "speak";
export type ReferencePart = "number" | "book" | "chapter" | "verse";

export interface ReferenceAnswer {
  // The book's number — "1" for 1 Corinthians — or "" for a book without one.
  number: string;
  // The book's name without its number ("Corinthians").
  book: string;
  chapter: string;
  verse: string;
}

// The parts asked for, in order — the book's number only when it has one.
export const referenceParts = (answer: ReferenceAnswer): ReferencePart[] => (answer.number ? ["number", "book", "chapter", "verse"] : ["book", "chapter", "verse"]);

// The parts entered as digits.
export const isNumberPart = (part: ReferencePart | undefined): boolean => part === "number" || part === "chapter" || part === "verse";

// "1 Corinthians" → ["1", "Corinthians"]; "Romans" → ["", "Romans"].
function splitBookNumber(book: string): [string, string] {
  const match = book.match(/^(\d+)\s+(.+)$/);
  return match ? [match[1], match[2]] : ["", book];
}

export function referenceAnswer(verse: VerseSegment): ReferenceAnswer {
  const [number, book] = splitBookNumber(verse.book);
  return { number, book, chapter: String(verse.chapter), verse: String(verse.verseNumber) };
}

// The book's first letter, the way a first-letter stage asks for a word ("1 John" → "J").
export const bookLetter = (book: string): string => (book.match(/[A-Za-z]/)?.[0] ?? "").toLowerCase();

// Word-bank choices for one part: the answer and three near it (neighbouring books; numbers a
// little either side; for a book's number, every number that book name has), shuffled steadily
// by the answer so they don't jump about on re-render.
export function bankChoices(part: ReferencePart, answer: ReferenceAnswer): string[] {
  const options = new Set<string>([answer[part]]);
  if (part === "number") {
    for (const book of BIBLE_BOOKS) {
      const [number, name] = splitBookNumber(book.name);
      if (number && name === answer.book) options.add(number);
    }
    return [...options].sort();
  }
  if (part === "book") {
    const fullName = answer.number ? `${answer.number} ${answer.book}` : answer.book;
    const at = Math.max(0, BIBLE_BOOKS.findIndex((book) => book.name === fullName));
    for (const step of [1, -1, 2, -2, 3, -3, 4, -4, 5]) {
      const book = BIBLE_BOOKS[at + step];
      if (book && options.size < 4) options.add(splitBookNumber(book.name)[1]);
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

// How a book's number is said — "First Corinthians", "one Corinthians", "1 Corinthians".
const SPOKEN_BOOK_NUMBERS: Record<string, string[]> = { "1": ["1", "one", "first", "1st"], "2": ["2", "two", "second", "2nd"], "3": ["3", "three", "third", "3rd"] };

// Whether a spoken reference has the book's number, the book (by its first letter, as the speech
// stages grade) and the chapter then the verse.
export function spokenReferenceMatches(transcript: string, answer: ReferenceAnswer): Record<ReferencePart, boolean> {
  const tokens = transcript.toLowerCase().split(/\s+/).filter(Boolean);
  const spokenNumber = SPOKEN_BOOK_NUMBERS[answer.number] ?? [];
  const bookAt = tokens.findIndex((word) => /[a-z]/.test(word) && word.startsWith(bookLetter(answer.book)) && !spokenNumber.includes(word));
  const book = bookAt >= 0;
  // The book's number counts only said before the book ("one John", not "John one").
  const number = !answer.number || (book && tokens.slice(0, bookAt).some((token) => spokenNumber.includes(token)));
  // The book's own number, said first ("one John one nine"), isn't the chapter.
  const heard = spokenNumbers(transcript);
  const numbers = answer.number && heard.length > 2 && heard[0] === Number(answer.number) ? heard.slice(1) : heard;
  const chapterAt = numbers.indexOf(Number(answer.chapter));
  return { number, book, chapter: chapterAt >= 0, verse: chapterAt >= 0 && numbers.slice(chapterAt + 1).includes(Number(answer.verse)) };
}
