"use client";

import type { ReactNode } from "react";
import type { VerseSegment } from "@/types";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import type { SenseLineWordRange } from "@/lib/senseLineWordRanges";
import { LessonPageCard } from "@/components/gamification/LessonPageCard";

interface LessonWholeDayPageCardProps {
  layout: ChapterReadingLayout;
  // Today's own REAL verses (e.g. LearnSection.tsx's `realVerses`) — never the single joined
  // "whole day" VerseSegment some whole-day phases build for their own internal word-index
  // math (see LearnSection.tsx's own `wholeDay`); LessonPageCard.tsx/ChapterPageContent.tsx
  // only ever know how to render REAL verses, the same ones the reading view itself has.
  verses: VerseSegment[];
  // Called once per real verse in `verses`, and once per CLAUSE within each (see
  // LessonPageCard.tsx's own renderActiveVerse doc comment) — `verseIndex` is that verse's own
  // position in `verses` (not its page/chapter-wide index), so a caller that sliced its own
  // per-word data (annotations, markers) against the whole-day joined text can find the right
  // verse's own slice; `range` narrows that further to just this one clause's own
  // [startIndex, endIndex) within THIS verse's own tokenizeVerseWords, so a multi-clause verse
  // still renders through the same hanging-indent line structure a non-active verse gets.
  renderActiveVerse: (verse: VerseSegment, verseIndex: number, range: SenseLineWordRange) => ReactNode;
}

// The whole-day counterpart to LessonPageCard.tsx's own single-verse contract — every one of
// today's real verses renders "active" (whatever `renderActiveVerse` returns) at once, on the
// SAME real reading-view page/size/position as the rest of the Learn flow, for the whole-day
// phases (Understand, Visualize, Pray) that used to render a single synthetic joined verse
// inside their own separately-sized LessonParchmentCard instead. Always opens on the FIRST real
// verse's own page — every caller shows everything at once and never progresses word by word.
export function LessonWholeDayPageCard({ layout, verses, renderActiveVerse }: LessonWholeDayPageCardProps) {
  const firstVerse = verses[0];
  if (!firstVerse) return null;
  const verseIds = new Set(verses.map((verse) => verse.id));

  return (
    <LessonPageCard
      layout={layout}
      activeVerse={firstVerse}
      isActive={(verse) => verseIds.has(verse.id)}
      renderActiveVerse={(verse, range) => {
        const verseIndex = verses.findIndex((candidate) => candidate.id === verse.id);
        return renderActiveVerse(verse, verseIndex, range);
      }}
    />
  );
}
