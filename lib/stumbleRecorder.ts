import type { VerseSegment } from "@/types";
import { getChapterVerses } from "@/lib/chapterContent";
import { parseToSenseLines } from "@/lib/senseLines";
import { isReferenceToken, tokenizeVerseWords } from "@/lib/verseWords";

// Where a word a drill was shown sits in its whole verse, for UserProgress.wordStumbleCounts (which
// counts per word of the whole verse — lib/stumbleTracking.ts). A drill can be shown just some of a
// verse's sense lines (lib/senseLineSlice.ts) or the verse with its reference as a first word
// (applyReferencePreference); this maps its word index back to the whole verse's. Undefined for
// the reference itself, or a slice whose whole verse isn't in the local cache (in this translation).
export function wholeVerseWord(shown: VerseSegment, index: number): { verse: VerseSegment; index: number } | undefined {
  const words = tokenizeVerseWords(shown.text);
  if (!words[index] || isReferenceToken(words[index])) return undefined;
  const shift = isReferenceToken(words[0] ?? "") ? 1 : 0;
  const [from, to] = shown.senseLines ?? [0, 0];
  if (!shown.senseLines) return { verse: { ...shown, text: words.slice(shift).join(" ") }, index: index - shift };
  const whole = getChapterVerses(shown.book, shown.chapter)?.find((verse) => verse.verseNumber === shown.verseNumber);
  const lines = whole ? parseToSenseLines(whole.text) : [];
  if (!whole || lines.slice(from, to + 1).join("\n") !== shown.text) return undefined;
  const offset = lines.slice(0, from).reduce((sum, line) => sum + tokenizeVerseWords(line).length, 0);
  return { verse: whole, index: offset + index };
}
