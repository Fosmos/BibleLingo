import type { ReactNode } from "react";
import type { VerseSegment } from "@/types";
import { senseLineWordRanges, type SenseLineWordRange } from "@/lib/senseLineWordRanges";

interface InlineVerseWordsProps {
  verses: VerseSegment[];
  // The stage's own words for a verse's range (LessonPageCard.tsx's renderActiveVerse) — the
  // verse's plain text where it gives none.
  render: (verse: VerseSegment, range: SenseLineWordRange) => ReactNode;
}

// A lesson's verse words flowing inline, mid-paragraph, in the verse's own place in the chapter
// reader with sense lines off (PathLessonVerseSlot.tsx's inline slot) — no blocks or line breaks,
// so the words sit exactly where the paragraph had them.
export function InlineVerseWords({ verses, render }: InlineVerseWordsProps) {
  return (
    <>
      {verses.map((verse) =>
        senseLineWordRanges(verse.text).map((range, index) => <span key={`${verse.id}-${index}`}>{render(verse, range) ?? `${range.clause.text} `}</span>),
      )}
    </>
  );
}
