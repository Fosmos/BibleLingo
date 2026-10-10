"use client";

import type { VerseSegment } from "@/types";
import { chapterPathVerses } from "@/lib/chapterPathVerses";
import { useChapterText } from "@/lib/useChapterText";
import { ChapterPericopeLevel } from "@/components/gamification/ChapterPericopeLevel";
import type { VerseStatus } from "@/components/gamification/ChapterPathVerseRow";
import { FetchLoading, FetchError } from "@/components/ui/FetchStatus";

interface ChapterPathLevelProps {
  book: string;
  chapter: number;
  version: string;
  // The active path's own verses — used as-is for its chapters; any other chapter is loaded.
  pathVerses: VerseSegment[];
  statusOf: (verseNumber: number) => VerseStatus;
  selected: number | null;
  onSelect: (verseNumber: number) => void;
  onAction: (verse: VerseSegment, status: VerseStatus) => void;
  onLearn: (verses: number[]) => void;
  onReview: (verses: number[]) => void;
  onBack: () => void;
  lessonVerse: number | null;
  isHidden: (verseNumber: number) => boolean;
}

// The Path tab's chapter level — one chapter as pericope cards (ChapterPericopeLevel.tsx), anywhere
// in the Bible: the path's own chapters straight from its verses, any other chapter fetched in its
// translation. Keyed by chapter so its open card and chosen verses start fresh on each.
export function ChapterPathLevel({ book, chapter, version, pathVerses, ...view }: ChapterPathLevelProps) {
  const onPath = pathVerses.some((verse) => verse.book === book && verse.chapter === chapter);
  const loaded = useChapterText(book, chapter, version, onPath);
  const verses = onPath ? chapterPathVerses(pathVerses, book, chapter, version) : loaded.verses;

  if (loaded.error) return <FetchError message={loaded.error} />;
  if (!verses) return <FetchLoading label={`Loading ${book} ${chapter}…`} />;
  return <ChapterPericopeLevel key={`${book}|${chapter}`} book={book} chapter={chapter} verses={verses} {...view} />;
}
