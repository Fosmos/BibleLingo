import type { VerseSegment } from "@/types";
import { tokenizeVerseWords } from "@/lib/verseWords";
import { sliceWordAnnotations, type WordAnnotationMap } from "@/lib/verseHighlights";
import type { SenseLineWordRange } from "@/lib/senseLineWordRanges";
import { AnnotatedVerseWord } from "@/components/drills/AnnotatedVerseWord";

interface AnnotatedVerseWordRangeProps {
  verse: VerseSegment;
  // This ONE clause's own range (see LessonPageCard.tsx's own renderActiveVerse doc comment) —
  // called once per clause so a multi-clause verse still renders through the same hanging-
  // indent line structure a non-active verse gets, not the whole verse repeated on every row.
  range: SenseLineWordRange;
  // Built against the whole DAY's joined text (see LearnSection.tsx's own `wordAnnotations`),
  // not this one verse's own — `verseOffset` (that verse's own start within it, see
  // LearnSection.tsx's own `verseOffsets`) plus `range.startIndex` (this clause's own start
  // within the verse) together locate this clause's own slice.
  wordAnnotations: WordAnnotationMap;
  verseOffset: number;
}

// Shared by VerseOrientationSummaryRep.tsx and PrayRep.tsx — both read-only "show this whole
// verse, highlighted with whatever Orientation annotated" renders, differing only in what sits
// below the card (the POA form vs. the prayer timer).
export function AnnotatedVerseWordRange({ verse, range, wordAnnotations, verseOffset }: AnnotatedVerseWordRangeProps) {
  const words = tokenizeVerseWords(verse.text).slice(range.startIndex, range.endIndex);
  const sliced = sliceWordAnnotations(wordAnnotations, verseOffset + range.startIndex, words.length);
  return (
    <>
      {words.map((word, index) => (
        <span key={index}>
          <AnnotatedVerseWord word={word} annotation={sliced[index]} />{" "}
        </span>
      ))}
    </>
  );
}
