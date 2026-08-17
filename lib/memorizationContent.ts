import type { PathKind, VerseSegment } from "@/types";
import { findBook } from "@/lib/bibleBooks";
import {
  availableChaptersForBook,
  formatChapterLabel,
  formatVerseSpanLabel,
  getChapterVerses,
  parseChapterKey,
} from "@/lib/chapterContent";
import { getMasteryLevel } from "@/lib/masteryMode";

export interface Topic {
  id: string;
  label: string;
  verses: VerseSegment[];
}

const ANXIETY_VERSES: VerseSegment[] = [
  {
    id: "anxiety-1",
    reference: "Philippians 4:6",
    text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.",
    book: "Philippians",
    chapter: 4,
    verseNumber: 6,
  },
  {
    id: "anxiety-2",
    reference: "Philippians 4:7",
    text: "And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.",
    book: "Philippians",
    chapter: 4,
    verseNumber: 7,
  },
  {
    id: "anxiety-3",
    reference: "1 Peter 5:7",
    text: "Casting all your care upon him; for he careth for you.",
    book: "1 Peter",
    chapter: 5,
    verseNumber: 7,
  },
  {
    id: "anxiety-4",
    reference: "Matthew 6:34",
    text: "Take therefore no thought for the morrow: for the morrow shall take thought for the things of itself. Sufficient unto the day is the evil thereof.",
    book: "Matthew",
    chapter: 6,
    verseNumber: 34,
  },
];

const DEPRESSION_VERSES: VerseSegment[] = [
  {
    id: "depression-1",
    reference: "Psalm 34:17",
    text: "The righteous cry, and the LORD heareth, and delivereth them out of all their troubles.",
    book: "Psalms",
    chapter: 34,
    verseNumber: 17,
  },
  {
    id: "depression-2",
    reference: "Psalm 34:18",
    text: "The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.",
    book: "Psalms",
    chapter: 34,
    verseNumber: 18,
  },
  {
    id: "depression-3",
    reference: "Psalm 42:11",
    text: "Why art thou cast down, O my soul? and why art thou disquieted within me? hope thou in God: for I shall yet praise him, who is the health of my countenance, and my God.",
    book: "Psalms",
    chapter: 42,
    verseNumber: 11,
  },
  {
    id: "depression-4",
    reference: "Isaiah 41:10",
    text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.",
    book: "Isaiah",
    chapter: 41,
    verseNumber: 10,
  },
];

const GLORY_VERSES: VerseSegment[] = [
  {
    id: "glory-1",
    reference: "Romans 8:18",
    text: "For I reckon that the sufferings of this present time are not worthy to be compared with the glory which shall be revealed in us.",
    book: "Romans",
    chapter: 8,
    verseNumber: 18,
  },
  {
    id: "glory-2",
    reference: "1 Corinthians 10:31",
    text: "Whether therefore ye eat, or drink, or whatsoever ye do, do all to the glory of God.",
    book: "1 Corinthians",
    chapter: 10,
    verseNumber: 31,
  },
  {
    id: "glory-3",
    reference: "Psalm 19:1",
    text: "The heavens declare the glory of God; and the firmament sheweth his handywork.",
    book: "Psalms",
    chapter: 19,
    verseNumber: 1,
  },
];

export const TOPICS: Topic[] = [
  { id: "anxiety", label: "Anxiety", verses: ANXIETY_VERSES },
  { id: "depression", label: "Depression", verses: DEPRESSION_VERSES },
  { id: "glory", label: "Glory", verses: GLORY_VERSES },
];

export function getTopic(id: string): Topic | undefined {
  return TOPICS.find((topic) => topic.id === id);
}

export function pathKey(kind: PathKind, identifier: string): string {
  return `${kind}:${identifier}`;
}

export function parsePathKey(key: string): { kind: PathKind; identifier: string } {
  const separatorIndex = key.indexOf(":");
  return { kind: key.slice(0, separatorIndex) as PathKind, identifier: key.slice(separatorIndex + 1) };
}

export function getBookVerses(book: string): VerseSegment[] | undefined {
  const chapters = Array.from(availableChaptersForBook(book)).sort((a, b) => a - b);
  if (chapters.length === 0) return undefined;
  const perChapter = chapters.map((chapter) => getChapterVerses(book, chapter));
  if (perChapter.some((verses) => !verses)) return undefined;
  return perChapter.flatMap((verses) => verses ?? []);
}

// A label for a path that's cheap and synchronous — never depends on fetched verse
// content, so it's safe to call from a server component or before any fetch completes.
// Also doubles as the sticker-book label resolver — manual SRS additions (see
// lib/memorizedEntities.ts) award stickers keyed "manual:Book|Chapter|Start-End" or
// "manual-book:Book" rather than a real PathKind, since they aren't a path at all.
export function resolvePathLabel(key: string): string | undefined {
  if (key.startsWith("mastery:")) {
    const [passageKey, version, levelStr] = key.slice("mastery:".length).split("::");
    const passageLabel = resolvePathLabel(passageKey);
    const levelConfig = getMasteryLevel(Number(levelStr));
    if (!passageLabel || !levelConfig) return undefined;
    return `${passageLabel} (${version}): ${levelConfig.label} — ${levelConfig.tagline}`;
  }

  if (key.startsWith("manual-book:")) {
    const book = key.slice("manual-book:".length);
    return findBook(book) ? book : undefined;
  }

  if (key.startsWith("manual:")) {
    const [book, chapterStr, range] = key.slice("manual:".length).split("|");
    const [startStr, endStr] = (range ?? "").split("-");
    const chapter = Number(chapterStr);
    const startVerse = Number(startStr);
    const endVerse = Number(endStr);
    return findBook(book) ? formatVerseSpanLabel(book, chapter, startVerse, endVerse) : undefined;
  }

  const { kind, identifier } = parsePathKey(key);

  if (kind === "book") {
    return findBook(identifier) ? identifier : undefined;
  }

  if (kind === "chapter") {
    const { book, chapter } = parseChapterKey(identifier);
    return findBook(book) ? formatChapterLabel(book, chapter) : undefined;
  }

  if (kind === "verse") {
    const [book, chapterStr, verseStr] = identifier.split("|");
    return findBook(book) ? `${formatChapterLabel(book, Number(chapterStr))}:${verseStr}` : undefined;
  }

  if (kind === "topic") {
    return getTopic(identifier)?.label;
  }

  return undefined;
}

export interface ResolvedPath {
  verses: VerseSegment[];
  label: string;
}

// Verses for book/chapter/verse kinds come from the client-side content cache — this
// returns undefined if that content hasn't been fetched yet, not just for invalid keys.
export function resolvePath(key: string): ResolvedPath | undefined {
  const { kind, identifier } = parsePathKey(key);
  const label = resolvePathLabel(key);
  if (!label) return undefined;

  if (kind === "book") {
    const verses = getBookVerses(identifier);
    return verses ? { verses, label } : undefined;
  }

  if (kind === "chapter") {
    const { book, chapter } = parseChapterKey(identifier);
    const verses = getChapterVerses(book, chapter);
    return verses ? { verses, label } : undefined;
  }

  if (kind === "verse") {
    const [book, chapterStr, verseStr] = identifier.split("|");
    const verses = getChapterVerses(book, Number(chapterStr));
    const verse = verses?.[Number(verseStr) - 1];
    return verse ? { verses: [verse], label } : undefined;
  }

  if (kind === "topic") {
    const topic = getTopic(identifier);
    return topic ? { verses: topic.verses, label } : undefined;
  }

  return undefined;
}
