import { wordLetterPlaceholder } from "@/lib/verseWords";
import { buildDrawTokens } from "@/lib/verseDrawTokens";

// Renders a verse as its words' first letters, but with the verse's own punctuation and verse-
// number markers kept in place too, and each letter padded out to its own word's real length
// (see lib/verseWords.ts's wordLetterPlaceholder) — e.g. "B____ s____ t___ t___..." for "But
// speak thou the..." — so a letter still sits roughly where its own word would, rather than
// every letter bunching together into one short compressed line. The display format for any
// stage/hint that shows "only the first letter of each word," reusing lib/verseDrawTokens.ts's
// tokenization (word/punctuation/verseNumber, with proper leading/trailing punctuation
// splitting and spacing) so this stays in sync with what Draw First Letter already treats as
// the passage's real structure. A reference token (e.g. "3:16", present as its own word when
// verse references are turned on — see applyReferencePreference) is kept whole rather than
// truncated to its first digit, matching every other first-letter mechanic in the app (see
// ReferenceNumberEntry.tsx): a lone "3" tells the user nothing about which verse, only the
// chapter.
export function firstLettersDisplay(text: string, verseMarkers: Record<number, number> = {}): string {
  const tokens = buildDrawTokens(text, verseMarkers);
  let result = "";
  for (const token of tokens) {
    const display = token.kind === "word" && !token.isReference ? wordLetterPlaceholder(token.text, true) : token.text;
    result += display;
    if (token.spaceAfter) result += " ";
  }
  return result.trim();
}

export interface FirstLetterHintToken {
  // What's shown: a word's first letter, or a punctuation mark / verse number / reference in
  // full (same rules as firstLettersDisplay above).
  display: string;
  // The word this letter stands for — set only for a genuine word token (not punctuation, a
  // verse number, or a reference, which are already shown in full and have nothing to
  // reveal). Hovering a token with this set reveals the word — see SpeakRep.tsx.
  fullWord?: string;
  spaceAfter: boolean;
}

// Same first-letters-with-punctuation-and-verse-numbers-kept-in-place display as
// firstLettersDisplay above, but as a token list rather than one flat string — lets a caller
// render each word's own letter as its own hoverable element (see SpeakRep.tsx's Remember
// stage: hover a first letter to reveal that one word).
export function firstLetterHintTokens(text: string, verseMarkers: Record<number, number> = {}): FirstLetterHintToken[] {
  const tokens = buildDrawTokens(text, verseMarkers);
  return tokens.map((token) => {
    if (token.kind === "word" && !token.isReference) {
      return { display: wordLetterPlaceholder(token.text, true), fullWord: token.text, spaceAfter: token.spaceAfter };
    }
    return { display: token.text, spaceAfter: token.spaceAfter };
  });
}
