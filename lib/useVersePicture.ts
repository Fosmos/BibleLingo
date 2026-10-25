"use client";

import { useProgressStore } from "@/store/useProgressStore";
import { getChapterVerses } from "@/lib/chapterContent";
import { getPericopeForVerse } from "@/lib/chapterPericopes";
import { passagePictures } from "@/lib/verseImages";

// A verse's picture (lib/verseImages.ts), worked out over its passage like everywhere else, for
// showing beside it while it's learned (PathLessonTopBar.tsx). Undefined until its text is here.
export function useVersePicture(book: string, chapter: number, verseNumber: number): string | undefined {
  const chosen = useProgressStore((state) => state.iconTags);
  const verses = getChapterVerses(book, chapter)?.filter((verse) => verse.text.trim());
  if (!verses?.some((verse) => verse.verseNumber === verseNumber)) return undefined;
  const pericope = getPericopeForVerse(book, chapter, verseNumber);
  // Verses before a chapter's first heading are a passage of their own, from the chapter's start.
  const firstHeading = verses.find((verse) => getPericopeForVerse(book, chapter, verse.verseNumber))?.verseNumber ?? Infinity;
  const [from, to] = pericope ? [pericope.startVerse, pericope.endVerse] : [1, firstHeading - 1];
  const passage = verses.filter((verse) => verse.verseNumber >= from && verse.verseNumber <= to);
  return passagePictures(passage, chosen)[passage.findIndex((verse) => verse.verseNumber === verseNumber)];
}
