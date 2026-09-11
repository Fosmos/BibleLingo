import { wordOrBlank } from "@/lib/verseWords";
import type { WordAnnotationMap } from "@/lib/verseHighlights";
import { AnnotatedVerseWord } from "@/components/drills/AnnotatedVerseWord";
import { VerseNumberMarker } from "@/components/drills/VerseNumberMarker";

interface WordRevealLineProps {
  // Every word in the line, in order — not just the ones typed/spoken so far.
  words: string[];
  // How many words, counting from the start, are actually revealed.
  revealedCount: number;
  annotations?: WordAnnotationMap;
  verseMarkers?: Record<number, number>;
}

// The whole line from the start — every word already typed/spoken shown in full, every word
// still to come shown as reserved blank space in its own real position (see
// lib/verseWords.ts's wordOrBlank) — so typing or speaking a word fills it into the exact spot
// it was always going to sit in, instead of the line only growing longer at the end as each
// word comes in. Shared by FirstLetterTypeRep.tsx and ReviewChain.tsx's own word-by-word reveal.
export function WordRevealLine({ words, revealedCount, annotations, verseMarkers }: WordRevealLineProps) {
  return (
    <>
      {words.map((word, index) => (
        <span key={index}>
          {verseMarkers?.[index] && (
            <>
              <br />
              <VerseNumberMarker number={verseMarkers[index]} />{" "}
            </>
          )}
          {index < revealedCount ? (
            <AnnotatedVerseWord word={word} annotation={annotations?.[index]} />
          ) : (
            <span>{wordOrBlank(word, false)}</span>
          )}{" "}
        </span>
      ))}
    </>
  );
}
