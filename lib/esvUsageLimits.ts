// Crossway's api.esv.org free-tier terms (https://api.esv.org/docs/) cap both a single
// query and total local storage at "500 verses per query, or half a book, whichever is
// less" — but that page explicitly EXCEPTS single-chapter and double-chapter books from
// the half-book half, leaving just the flat 500-verse cap for them (which no book that
// short ever approaches). Enforced in lib/bibleApiClient.ts before anything gets cached —
// see esvCacheTracker.ts for the running per-book tally this checks against.

// Standard KJV/ESV versification verse counts per book. ESV occasionally differs from
// KJV by a verse or two in a handful of books (footnote/versification choices) — these
// counts are a good-faith approximation, not a certified figure from Crossway, so the
// cap below is computed conservatively (floored, never rounded up).
const BOOK_VERSE_COUNTS: Record<string, number> = {
  Genesis: 1533,
  Exodus: 1213,
  Leviticus: 859,
  Numbers: 1288,
  Deuteronomy: 959,
  Joshua: 658,
  Judges: 618,
  Ruth: 85,
  "1 Samuel": 810,
  "2 Samuel": 695,
  "1 Kings": 816,
  "2 Kings": 719,
  "1 Chronicles": 942,
  "2 Chronicles": 822,
  Ezra: 280,
  Nehemiah: 406,
  Esther: 167,
  Job: 1070,
  Psalms: 2461,
  Proverbs: 915,
  Ecclesiastes: 222,
  "Song of Solomon": 117,
  Isaiah: 1292,
  Jeremiah: 1364,
  Lamentations: 154,
  Ezekiel: 1273,
  Daniel: 357,
  Hosea: 197,
  Joel: 73,
  Amos: 146,
  Obadiah: 21,
  Jonah: 48,
  Micah: 105,
  Nahum: 47,
  Habakkuk: 56,
  Zephaniah: 53,
  Haggai: 38,
  Zechariah: 211,
  Malachi: 55,
  Matthew: 1071,
  Mark: 678,
  Luke: 1151,
  John: 879,
  Acts: 1007,
  Romans: 433,
  "1 Corinthians": 437,
  "2 Corinthians": 257,
  Galatians: 149,
  Ephesians: 155,
  Philippians: 104,
  Colossians: 95,
  "1 Thessalonians": 89,
  "2 Thessalonians": 47,
  "1 Timothy": 113,
  "2 Timothy": 83,
  Titus: 46,
  Philemon: 25,
  Hebrews: 303,
  James: 108,
  "1 Peter": 105,
  "2 Peter": 61,
  "1 John": 105,
  "2 John": 13,
  "3 John": 14,
  Jude: 25,
  Revelation: 404,
};

const MAX_STORED_VERSES = 500;

// `chapterCount` is the BOOK's total chapter count (from lib/bibleBooks.ts), not the
// chapter being loaded — it only decides whether the single/double-chapter exception
// applies, matching api.esv.org's own carve-out. Every one- or two-chapter book (Obadiah,
// Philemon, 2 John, 3 John, Jude, Haggai, ...) is short enough that the flat 500-verse cap
// never binds either, so this effectively lets them load in full.
export function getEsvBookVerseCap(book: string, chapterCount: number): number {
  if (chapterCount <= 2) return MAX_STORED_VERSES;
  const totalVerses = BOOK_VERSE_COUNTS[book] ?? MAX_STORED_VERSES * 2;
  return Math.min(MAX_STORED_VERSES, Math.floor(totalVerses / 2));
}
