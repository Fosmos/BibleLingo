import { firstLetterWithPunctuation, hiddenWordBlank } from "@/lib/verseWords";
import { FIRST_LETTER_GAP_CLASS } from "@/lib/firstLetterGap";
import type { WordAnnotationMap } from "@/lib/verseHighlights";
import { AnnotatedVerseWord } from "@/components/drills/AnnotatedVerseWord";
import { VerseNumberMarker } from "@/components/drills/VerseNumberMarker";

interface WordRevealLineProps {
  // Every word in the line, in order — not just the ones typed/spoken so far.
  words: string[];
  // How many words, counting from the start of the FULL verse (see `startIndex` below), are
  // actually revealed.
  revealedCount: number;
  annotations?: WordAnnotationMap;
  verseMarkers?: Record<number, number>;
  // `words`' own starting position within the full verse's own tokenizeVerseWords array —
  // undefined (0) for a caller passing the WHOLE verse at once; set to a clause's own
  // `range.startIndex` (see lib/senseLines.ts's senseLineWordRanges) by a caller rendering just
  // ONE clause's own slice (see LessonPageCard.tsx's own renderActiveVerse doc comment), so
  // `annotations`/`verseMarkers` (both keyed against the FULL verse's own word indices) and the
  // revealed/not-yet-revealed comparison against `revealedCount` still line up correctly.
  startIndex?: number;
  // First-letter typing drills — a word already typed shows as just its first letter with its own
  // punctuation (see lib/verseWords.ts's firstLetterWithPunctuation), not the whole word.
  firstLettersOnly?: boolean;
}

// The whole line from the start — every word already typed/spoken shown in full, every word
// still to come shown as reserved blank space in its own real position, its punctuation hidden
// too (see lib/verseWords.ts's hiddenWordBlank) — so typing or speaking a word fills it into the spot
// it was always going to sit in, instead of the line only growing longer at the end as each
// word comes in. Shared by FirstLetterTypeRep.tsx and ReviewChain.tsx's own word-by-word reveal.
export function WordRevealLine({ words, revealedCount, annotations, verseMarkers, startIndex = 0, firstLettersOnly = false }: WordRevealLineProps) {
  return (
    <>
      {words.map((word, offset) => {
        const index = startIndex + offset;
        return (
          <span key={index}>
            {verseMarkers?.[index] && (
              <>
                <br />
                <VerseNumberMarker number={verseMarkers[index]} />{" "}
              </>
            )}
            {index < revealedCount ? (
              <AnnotatedVerseWord word={firstLettersOnly ? firstLetterWithPunctuation(word) : word} annotation={annotations?.[index]} className={firstLettersOnly ? FIRST_LETTER_GAP_CLASS : ""} />
            ) : (
              <span>{hiddenWordBlank(word)}</span>
            )}{" "}
          </span>
        );
      })}
    </>
  );
}
