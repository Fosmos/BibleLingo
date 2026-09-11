import { wordLetterPlaceholder } from "@/lib/verseWords";

interface FirstLetterVerseWordsProps {
  // This one real verse's own words only (see FirstLetterMultiVersePageCard.tsx) — never the
  // full combined-entity word list.
  words: string[];
  // This verse's own starting position within the combined entity's own word count (see
  // FirstLetterMultiVersePageCard.tsx's own verseWordOffsets) — lets a word here compare
  // itself against `revealedCount`, which counts against that SAME combined indexing.
  offset: number;
  revealedCount: number;
}

// SRS review's own multi-verse word rendering on the real page — a word already recalled shows
// in FULL (the reader typed its first letter correctly, and then gets to read the whole word
// back, same as ReviewChain.tsx's own combine stage). A word not reached yet shows NOTHING but
// a same-width blank — no first letter, no punctuation, nothing that leaks the sentence's shape
// ahead of actually recalling it (`alwaysShowPunctuation: false` — see wordLetterPlaceholder's
// own doc comment). Reused by both FirstLetterTypeRep.tsx and FirstLetterSpeakRep.tsx's own
// multi-verse real-page rendering.
export function FirstLetterVerseWords({ words, offset, revealedCount }: FirstLetterVerseWordsProps) {
  return (
    <>
      {words.map((word, index) => (
        <span key={index}>{offset + index < revealedCount ? word : wordLetterPlaceholder(word, false, false)} </span>
      ))}
    </>
  );
}
