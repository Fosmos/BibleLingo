import type { WordAnnotationMap } from "@/lib/verseHighlights";
import { firstWordCharacter, isReferenceToken } from "@/lib/verseWords";
import { AnnotatedVerseWord } from "@/components/drills/AnnotatedVerseWord";
import { VerseNumberMarker } from "@/components/drills/VerseNumberMarker";

interface RevealedWordsListProps {
  words: string[];
  annotations?: WordAnnotationMap;
  verseMarkers?: Record<number, number>;
  // SRS review only (see FirstLetterTypeRep.tsx) — shows each already-typed word as just its
  // own first letter (no surrounding punctuation), never the real word, so a correct guess
  // never doubles as reading the verse straight off the screen. A reference token (e.g.
  // "3:16") is shown in full either way — it's not spoiler text, just a structural marker,
  // same convention lib/verseFirstLetters.ts's own first-letters displays already use.
  lettersOnly?: boolean;
}

// The "words revealed so far" rendering shared by FirstLetterTypeRep's own reveal box — split
// out purely to keep that file under this codebase's 200-line cap, not because this logic is
// reused elsewhere yet.
export function RevealedWordsList({ words, annotations, verseMarkers, lettersOnly }: RevealedWordsListProps) {
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
          {lettersOnly ? <span>{isReferenceToken(word) ? word : (firstWordCharacter(word) ?? "")}</span> : <AnnotatedVerseWord word={word} annotation={annotations?.[index]} />}{" "}
        </span>
      ))}
    </>
  );
}
