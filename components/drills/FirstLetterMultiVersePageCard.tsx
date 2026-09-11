"use client";

import { useMemo } from "react";
import type { VerseSegment } from "@/types";
import { tokenizeVerseWords } from "@/lib/verseWords";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { LessonPageCard } from "@/components/gamification/LessonPageCard";
import { FirstLetterVerseWords } from "@/components/drills/FirstLetterVerseWords";

interface FirstLetterMultiVersePageCardProps {
  layout: ChapterReadingLayout;
  // Every real verse this SRS entity covers (see SrsEntityRecall.tsx) — never the single
  // joined synthetic verse FirstLetterTypeRep/FirstLetterSpeakRep use for their own typing/
  // speaking word-index math.
  verses: VerseSegment[];
  // How many words of the COMBINED entity (joinVerses(verses, ...), tokenized the identical
  // way — see FirstLetterTypeRep.tsx/FirstLetterSpeakRep.tsx) have been revealed so far.
  revealedCount: number;
  // Which real verse is CURRENTLY being typed/spoken (see typing.currentVerseNumber /
  // speaking.currentVerseNumber) — decides which real PAGE opens (see LessonPageCard.tsx's own
  // `activeVerse`). An entity spanning several real pages (unlike a single Learn day's own
  // verses, which always fit on one) needs this to actually FOLLOW the reader page to page as
  // they progress, rather than staying stuck on whichever page verse 1 happens to live on.
  currentVerseNumber: number;
}

// SRS review's own multi-verse "first letter only" rendering — every real verse on the SAME
// real page `currentVerseNumber` currently lives on renders at its own real position (see
// LessonPageCard.tsx), each word shown as just its own first letter once `revealedCount`
// reaches it, nothing at all before that (see FirstLetterVerseWords.tsx) — never the full word
// Learn's own single-verse `layout` mode reveals, matching this review's own "letters only"
// convention.
export function FirstLetterMultiVersePageCard({ layout, verses, revealedCount, currentVerseNumber }: FirstLetterMultiVersePageCardProps) {
  const verseWords = useMemo(() => verses.map((verse) => tokenizeVerseWords(verse.text)), [verses]);
  const verseWordOffsets = useMemo(() => {
    const offsets: number[] = [];
    for (let i = 0; i < verseWords.length; i++) offsets.push((offsets[i - 1] ?? 0) + (verseWords[i - 1]?.length ?? 0));
    return offsets;
  }, [verseWords]);
  const verseIds = useMemo(() => new Set(verses.map((verse) => verse.id)), [verses]);
  const activeVerse = verses.find((verse) => verse.verseNumber === currentVerseNumber) ?? verses[0];
  if (!activeVerse) return null;

  // A verse's own number appears once every word BEFORE it has been revealed — i.e. the reader
  // has just recalled the last word of the previous verse. The entity's first verse (offset 0)
  // is always shown; a verse outside the entity (idx -1, rendered in full) always shows too.
  const isVerseNumberVisible = (verse: VerseSegment) => {
    const idx = verses.findIndex((candidate) => candidate.id === verse.id);
    return idx < 0 || (verseWordOffsets[idx] ?? 0) <= revealedCount;
  };

  return (
    <LessonPageCard
      layout={layout}
      activeVerse={activeVerse}
      isActive={(verse) => verseIds.has(verse.id)}
      renderActiveVerse={(verse) => {
        // `verse` here is whatever this real PAGE actually holds — the whole verse, or (see
        // lib/chapterPagination.ts) just one fragment of it, if it was split across the page
        // break. Tokenizing `verse.text` directly (not re-deriving from the entity's own full
        // verse) renders only the words this fragment actually holds; its own `wordOffset`
        // (0 for a whole verse or the first fragment) shifts the combined-entity offset past
        // whatever words of this SAME verse already showed on the page before it.
        const verseIndex = verses.findIndex((candidate) => candidate.id === verse.id);
        const fragmentOffset = (verseWordOffsets[verseIndex] ?? 0) + (verse.wordOffset ?? 0);
        return <FirstLetterVerseWords words={tokenizeVerseWords(verse.text)} offset={fragmentOffset} revealedCount={revealedCount} />;
      }}
      allowManualFlip
      isVerseNumberVisible={isVerseNumberVisible}
      // A pericope heading opening somewhere mid-entity stays hidden until recall actually
      // reaches its own first verse — same "don't leak it ahead of actually recalling it"
      // reasoning as FirstLetterVerseWords.tsx's own punctuation handling. The very first
      // segment on the page is always visible: its own startVerse is never AFTER
      // currentVerseNumber, since the entity's own range can only ever pick up partway through
      // (or right at) whichever pericope it starts in, never before it.
      isHeadingVisible={(segment) => segment.startVerse <= currentVerseNumber}
    />
  );
}
