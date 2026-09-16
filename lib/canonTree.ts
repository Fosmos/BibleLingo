import type { BibleBook, PathProgress } from "@/types";
import { BIBLE_BOOKS } from "@/lib/bibleBooks";
import { pathKey } from "@/lib/memorizationContent";
import { getMemorizedVerses } from "@/lib/progressSummary";
import type { BookTheme } from "@/lib/bookThemes";

export type TestamentId = "old" | "new";

export const TESTAMENT_LABELS: Record<TestamentId, string> = {
  old: "Old Testament",
  new: "New Testament",
};

// Every book, grouped by testament, in the same canonical order BIBLE_BOOKS already keeps —
// the Mind Map's own Bible -> Testament level (see lib/mindMapHierarchy.ts). Grouping is all
// this adds; nothing here re-derives book/chapter data lib/bibleBooks.ts already carries.
export function booksByTestament(): Record<TestamentId, BibleBook[]> {
  const groups: Record<TestamentId, BibleBook[]> = { old: [], new: [] };
  for (const book of BIBLE_BOOKS) groups[book.testament].push(book);
  return groups;
}

// The literary-genre grouping the Mind Map inserts between Testament and Book — the
// one level BIBLE_BOOKS itself carries no data for, kept as a lookup here (rather than a field
// on BibleBook in types/index.ts) since it's purely a mind-map navigation concern, not a fact
// every consumer of a BibleBook needs to know about. A genre id is shared across testaments
// ("history" covers both Joshua-Esther and Acts) since genre grouping only ever runs AFTER
// splitting by testament (see genresForTestament below) — a shared id never actually mixes OT
// and NT books together.
export type GenreId = "law" | "history" | "wisdom" | "prophets" | "gospels" | "epistles" | "prophecy";

export const GENRE_LABELS: Record<GenreId, string> = {
  law: "Law",
  history: "History",
  wisdom: "Wisdom",
  prophets: "Prophets",
  gospels: "Gospels",
  epistles: "Epistles",
  prophecy: "Prophecy",
};

// Display order within a testament — Law before History before Wisdom before Prophets (OT),
// Gospels before History before Epistles before Prophecy (NT), matching canonical book order in
// both cases; a testament simply skips whichever ids have no books in it. Kept as two separate
// orderings (not one shared list) because canonical order genuinely interleaves them differently
// per testament — OT's History (Joshua–Esther) sits right after Law, but NT's History (Acts)
// sits right after Gospels, not before them.
const TESTAMENT_GENRE_ORDER: Record<TestamentId, GenreId[]> = {
  old: ["law", "history", "wisdom", "prophets"],
  new: ["gospels", "history", "epistles", "prophecy"],
};

const BOOK_GENRE: Record<string, GenreId> = {
  Genesis: "law", Exodus: "law", Leviticus: "law", Numbers: "law", Deuteronomy: "law",
  Joshua: "history", Judges: "history", Ruth: "history", "1 Samuel": "history", "2 Samuel": "history",
  "1 Kings": "history", "2 Kings": "history", "1 Chronicles": "history", "2 Chronicles": "history",
  Ezra: "history", Nehemiah: "history", Esther: "history",
  Job: "wisdom", Psalms: "wisdom", Proverbs: "wisdom", Ecclesiastes: "wisdom", "Song of Solomon": "wisdom",
  Isaiah: "prophets", Jeremiah: "prophets", Lamentations: "prophets", Ezekiel: "prophets", Daniel: "prophets",
  Hosea: "prophets", Joel: "prophets", Amos: "prophets", Obadiah: "prophets", Jonah: "prophets",
  Micah: "prophets", Nahum: "prophets", Habakkuk: "prophets", Zephaniah: "prophets", Haggai: "prophets",
  Zechariah: "prophets", Malachi: "prophets",
  Matthew: "gospels", Mark: "gospels", Luke: "gospels", John: "gospels",
  Acts: "history",
  Romans: "epistles", "1 Corinthians": "epistles", "2 Corinthians": "epistles", Galatians: "epistles",
  Ephesians: "epistles", Philippians: "epistles", Colossians: "epistles", "1 Thessalonians": "epistles",
  "2 Thessalonians": "epistles", "1 Timothy": "epistles", "2 Timothy": "epistles", Titus: "epistles",
  Philemon: "epistles", Hebrews: "epistles", James: "epistles", "1 Peter": "epistles", "2 Peter": "epistles",
  "1 John": "epistles", "2 John": "epistles", "3 John": "epistles", Jude: "epistles",
  Revelation: "prophecy",
};

export function bookGenre(book: BibleBook): GenreId {
  return BOOK_GENRE[book.name] ?? "history";
}

// The Testament level's own children, grouped by genre in GENRE_ORDER — the Mind Map's own
// Testament -> Genre level. Genesis-Esther's own testament, for instance, resolves to exactly
// "law" and "history"; a testament with no book in a given genre just never produces that entry.
export function genresForTestament(testament: TestamentId, books: BibleBook[]): { genre: GenreId; books: BibleBook[] }[] {
  const byGenre = new Map<GenreId, BibleBook[]>();
  for (const book of books) {
    if (book.testament !== testament) continue;
    const genre = bookGenre(book);
    const existing = byGenre.get(genre);
    if (existing) existing.push(book);
    else byGenre.set(genre, [book]);
  }
  return TESTAMENT_GENRE_ORDER[testament].filter((genre) => byGenre.has(genre)).map((genre) => ({ genre, books: byGenre.get(genre)! }));
}

// The one further split the Mind Map inserts between Genre and Book, but ONLY for the two
// genres large/varied enough to want it — Epistles (Pauline vs. General) and Prophets (Major
// vs. Minor); every other genre skips this level entirely (see subgenresForGenre below), same
// "optional layer" precedent BOOK_THEMES already sets for Theme between Book and Chapter.
export type SubgenreId = "pauline" | "general" | "major" | "minor";

export const SUBGENRE_LABELS: Record<SubgenreId, string> = {
  pauline: "Pauline Epistles",
  general: "General Epistles",
  major: "Major Prophets",
  minor: "Minor Prophets",
};

const SUBGENRE_ORDER: Partial<Record<GenreId, SubgenreId[]>> = {
  epistles: ["pauline", "general"],
  prophets: ["major", "minor"],
};

// Hebrews' own authorship is traditionally disputed, so it's grouped with the General Epistles
// (its own audience/style reads closer to that set) rather than the Pauline ones, the common
// convention this follows.
const BOOK_SUBGENRE: Partial<Record<string, SubgenreId>> = {
  Romans: "pauline", "1 Corinthians": "pauline", "2 Corinthians": "pauline", Galatians: "pauline",
  Ephesians: "pauline", Philippians: "pauline", Colossians: "pauline", "1 Thessalonians": "pauline",
  "2 Thessalonians": "pauline", "1 Timothy": "pauline", "2 Timothy": "pauline", Titus: "pauline", Philemon: "pauline",
  Hebrews: "general", James: "general", "1 Peter": "general", "2 Peter": "general",
  "1 John": "general", "2 John": "general", "3 John": "general", Jude: "general",
  Isaiah: "major", Jeremiah: "major", Lamentations: "major", Ezekiel: "major", Daniel: "major",
  Hosea: "minor", Joel: "minor", Amos: "minor", Obadiah: "minor", Jonah: "minor", Micah: "minor",
  Nahum: "minor", Habakkuk: "minor", Zephaniah: "minor", Haggai: "minor", Zechariah: "minor", Malachi: "minor",
};

export function bookSubgenre(book: BibleBook): SubgenreId | undefined {
  return BOOK_SUBGENRE[book.name];
}

// A genre's own Subgenre -> Book grouping, in SUBGENRE_ORDER's order — null for every genre
// that has no split defined at all (most of them), which the Mind Map reads as "skip straight to
// Book," the same way a theme-less book skips straight to Chapter.
export function subgenresForGenre(genre: GenreId, books: BibleBook[]): { subgenre: SubgenreId; books: BibleBook[] }[] | null {
  const order = SUBGENRE_ORDER[genre];
  if (!order) return null;
  const bySubgenre = new Map<SubgenreId, BibleBook[]>();
  for (const book of books) {
    const subgenre = bookSubgenre(book);
    if (!subgenre) continue;
    const existing = bySubgenre.get(subgenre);
    if (existing) existing.push(book);
    else bySubgenre.set(subgenre, [book]);
  }
  return order.filter((subgenre) => bySubgenre.has(subgenre)).map((subgenre) => ({ subgenre, books: bySubgenre.get(subgenre)! }));
}

// Which chapters of `book` have graduated into SRS — computed ONCE per book (not once per
// chapter) so the Mind Map can render every book's own completion badge off a single pass
// instead of re-deriving this same set on every one of them. Deliberately BOOK-MODE-only: a
// reader who instead worked through this book's chapters one at a time via separate
// CHAPTER-mode paths reads none-completed here even though they've genuinely made progress —
// cross-referencing every possible chapter-mode path key against this book would mean this
// could no longer stay a cheap, sync, already-in-memory computation, and the Mind Map's own
// progressive-disclosure design (nothing below a collapsed node eager-loads until expanded)
// depends on every level staying cheap enough to compute for all 66 books at once.
export function completedChaptersForBook(paths: Record<string, PathProgress>, book: BibleBook): Set<number> {
  const plan = paths[pathKey("book", book.name)];
  if (!plan) return new Set();
  const memorized = getMemorizedVerses({ [pathKey("book", book.name)]: plan });
  return new Set(memorized.map((entry) => entry.verse.chapter));
}

// A rough per-book completion percentage — "chapters graduated / total chapters" — Book
// node's own badge. 0% for a book with no book-mode path at all, same as one genuinely never
// started.
export function bookCompletionPercent(paths: Record<string, PathProgress>, book: BibleBook): number {
  return Math.round((completedChaptersForBook(paths, book).size / book.chapterCount) * 100);
}

// A theme's own slice of its book's completion — same "chapters graduated / chapters in range"
// math as bookCompletionPercent, just scoped to the theme's own startChapter..endChapter rather
// than the whole book, reusing the SAME completedChaptersForBook set (one computation per book,
// not one per theme) since a theme is purely a display grouping over chapters that already carry
// their own real completion state.
export function themeCompletionPercent(paths: Record<string, PathProgress>, book: BibleBook, theme: BookTheme): number {
  const completed = completedChaptersForBook(paths, book);
  const totalChapters = theme.endChapter - theme.startChapter + 1;
  let completedChapters = 0;
  for (let chapter = theme.startChapter; chapter <= theme.endChapter; chapter++) {
    if (completed.has(chapter)) completedChapters++;
  }
  return totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
}

// Chapter-weighted average across any group of books — Testament AND Genre nodes' own
// aggregate badge in the Mind Map; which group `books` came from is irrelevant to the math.
export function groupCompletionPercent(paths: Record<string, PathProgress>, books: BibleBook[]): number {
  let totalChapters = 0;
  let completedChapters = 0;
  for (const book of books) {
    totalChapters += book.chapterCount;
    completedChapters += completedChaptersForBook(paths, book).size;
  }
  return totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
}
