"use client";

import type { ReactNode } from "react";
import type { VerseSegment } from "@/types";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { LessonPageCard } from "@/components/gamification/LessonPageCard";

interface LessonWholeDayPageCardProps {
  layout: ChapterReadingLayout;
  // Today's own REAL verses (e.g. LearnSection.tsx's `realVerses`) — never the single joined
  // "whole day" VerseSegment some whole-day phases build for their own internal word-index
  // math (see LearnSection.tsx's own `wholeDay`); LessonPageCard.tsx/ChapterPageContent.tsx
  // only ever know how to render REAL verses, the same ones the reading view itself has.
  verses: VerseSegment[];
  // Called once per real verse in `verses` — `verseIndex` is that verse's own position in
  // `verses` (not its page/chapter-wide index), so a caller that sliced its own per-word data
  // (annotations, markers) against the whole-day joined text can find the right slice.
  renderActiveVerse: (verse: VerseSegment, verseIndex: number) => ReactNode;
}

// The whole-day counterpart to LessonPageCard.tsx's own single-verse contract — every one of
// today's real verses renders "active" (whatever `renderActiveVerse` returns) at once, on the
// SAME real reading-view page/size/position as the rest of the Learn flow, for the whole-day
// phases (Understand, Visualize, Listen, Pray) that used to render a single synthetic joined
// verse inside their own separately-sized LessonParchmentCard instead.
export function LessonWholeDayPageCard({ layout, verses, renderActiveVerse }: LessonWholeDayPageCardProps) {
  const firstVerse = verses[0];
  if (!firstVerse) return null;
  const verseIds = new Set(verses.map((verse) => verse.id));

  return (
    <LessonPageCard
      layout={layout}
      activeVerse={firstVerse}
      isActive={(verse) => verseIds.has(verse.id)}
      renderActiveVerse={(verse) => {
        const verseIndex = verses.findIndex((candidate) => candidate.id === verse.id);
        return renderActiveVerse(verse, verseIndex);
      }}
    />
  );
}
