import { tokenizeVerseWords } from "@/lib/verseWords";
import type { SenseLineWordRange } from "@/lib/senseLineWordRanges";

export type DrawTokenKind = "word" | "punctuation" | "verseNumber";

export interface DrawToken {
  kind: DrawTokenKind;
  // For "word": the word's letters only, punctuation stripped from both ends (internal
  // apostrophes like "don't" are preserved). For "punctuation": the punctuation mark(s)
  // themselves. For "verseNumber": the verse number as a string.
  text: string;
  // Index into tokenizeVerseWords(verse.text) this word came from — present only for "word"
  // tokens, so annotation lookups (keyed the same way) still line up despite punctuation and
  // verse numbers now having their own token slots in between.
  wordIndex?: number;
  // A chapter:verse reference token (e.g. "3:16", from the includeVerseReferences setting) —
  // revealed in full rather than truncated to its first digit, same as everywhere else in
  // the app: a lone "3" is meaningless on its own.
  isReference?: boolean;
  // Rendering hint: whether a space belongs after this token — false for a word immediately
  // followed by its own trailing punctuation, or for leading punctuation immediately followed
  // by its own word, so `"Behold,` renders as one unbroken unit instead of `" Behold ,`.
  spaceAfter: boolean;
}

const REFERENCE_PATTERN = /^(\d+):(\d+)$/;
const LEADING_PUNCT = /^[^\p{L}\p{N}]+/u;
const TRAILING_PUNCT = /[^\p{L}\p{N}]+$/u;

// Expands a verse's words into a fuller draw-and-reveal sequence: leading/trailing
// punctuation split off into their own tokens (e.g. the opening quote and comma around
// `"Behold,`), and a verse-number token inserted wherever verseNumberMarkers (see
// lib/verseBatching.ts) says a new verse starts — so the Draw First Letter stage has the
// user draw (and then reveals) those too, not just each word's own first letter.
export function buildDrawTokens(verseText: string, verseMarkers: Record<number, number>): DrawToken[] {
  const rawWords = tokenizeVerseWords(verseText);
  const tokens: DrawToken[] = [];

  rawWords.forEach((raw, wordIndex) => {
    if (verseMarkers[wordIndex]) {
      tokens.push({ kind: "verseNumber", text: String(verseMarkers[wordIndex]), spaceAfter: true });
    }
    if (REFERENCE_PATTERN.test(raw)) {
      tokens.push({ kind: "word", text: raw, wordIndex, isReference: true, spaceAfter: true });
      return;
    }
    const leading = raw.match(LEADING_PUNCT)?.[0] ?? "";
    const withoutLeading = raw.slice(leading.length);
    const trailing = withoutLeading.match(TRAILING_PUNCT)?.[0] ?? "";
    const body = withoutLeading.slice(0, withoutLeading.length - trailing.length);

    if (leading) tokens.push({ kind: "punctuation", text: leading, spaceAfter: false });
    tokens.push({ kind: "word", text: body, wordIndex, spaceAfter: !trailing });
    if (trailing) tokens.push({ kind: "punctuation", text: trailing, spaceAfter: true });
  });

  return tokens;
}

// Groups `tokens`' own INDICES (not the tokens themselves — a caller still needs each token's
// original position in `tokens` for its own revealed/current-token comparisons) by which sense-
// line clause each one falls in, in their own natural verse-text order — see
// DrawFirstLetterRep.tsx's own use, rendering the active verse through the SAME multi-line
// clause structure a non-active verse gets (see lib/senseLines.ts's own senseLineWordRanges)
// instead of one dense merged block. A non-word token (punctuation, a verse number) always
// joins whatever clause the WORD token immediately before it belongs to, since punctuation
// always trails the word it punctuates. Only "word" tokens carry a real `wordIndex` to check
// against a clause's own [startIndex, endIndex) range; everything else just rides along with
// the clause the walk is currently inside.
export function bucketTokenIndicesByClause(tokens: DrawToken[], ranges: SenseLineWordRange[]): number[][] {
  const buckets: number[][] = ranges.map(() => []);
  let rangeIndex = 0;
  tokens.forEach((token, index) => {
    while (rangeIndex < ranges.length - 1 && token.kind === "word" && token.wordIndex !== undefined && token.wordIndex >= ranges[rangeIndex].endIndex) {
      rangeIndex++;
    }
    buckets[rangeIndex]?.push(index);
  });
  return buckets;
}
