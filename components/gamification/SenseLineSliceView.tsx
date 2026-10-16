import type { ReactNode } from "react";
import type { VerseSegment } from "@/types";
import { senseLineWordRanges, type SenseLineWordRange } from "@/lib/senseLineWordRanges";
import { getChapterVerses } from "@/lib/chapterContent";
import { tokenizeVerseWords } from "@/lib/verseWords";
import { HiddenWord } from "@/components/drills/HiddenWord";

export interface SenseLineSliceView {
  // The whole verse the slice was cut from, which the verse zone shows.
  whole: VerseSegment;
  // Renders one of the whole verse's lines: a drilled line through the stage, an earlier line as
  // its first letters, a later line left as it is (undefined).
  renderLine: (range: SenseLineWordRange) => ReactNode | undefined;
}

// A sense-line Learn stage (lib/senseLineSlice.ts) shows the whole verse around the lines it
// drills: the lines before them as just their first letters, the lines after them in full, and
// the drilled lines handed to the stage with word indices into its own slice. Null for a whole
// verse, or before its chapter is loaded.
export function senseLineSliceView(slice: VerseSegment, renderSlice: (verse: VerseSegment, range: SenseLineWordRange) => ReactNode): SenseLineSliceView | null {
  if (!slice.senseLines) return null;
  const whole = getChapterVerses(slice.book, slice.chapter)?.find((verse) => verse.verseNumber === slice.verseNumber);
  if (!whole) return null;
  const lines = senseLineWordRanges(whole.text);
  const [from, to] = slice.senseLines;
  const start = lines[from]?.startIndex ?? 0;
  const end = lines[to]?.endIndex ?? start;
  return {
    whole,
    renderLine: (range) => {
      if (range.startIndex >= end) return undefined;
      if (range.endIndex <= start) {
        return tokenizeVerseWords(range.clause.text).map((word, index) => (
          <span key={index}>
            <HiddenWord word={word} firstLetter />{" "}
          </span>
        ));
      }
      return renderSlice(slice, { ...range, startIndex: range.startIndex - start, endIndex: range.endIndex - start });
    },
  };
}
