import type { VerseSegment } from "@/types";
import { verseNumberDecorationPx } from "@/lib/textMeasurement";

export function rawTokensOf(verse: VerseSegment): string[] {
  return verse.text.split(/\s+/).filter((token) => token.length > 0);
}

// A piece's own accumulated raw word tokens (see rawTokensOf), plus, in parallel, how much
// EXTRA leading width each token's own line-wrap measurement should carry — see
// verseNumberDecorationPx's own doc comment. `wrapWordsIntoLines` (lib/textMeasurement.ts)
// takes `extraLeadingPx` directly, so pagination's own line-fitting math accounts for the
// verse-number badge instead of silently under-measuring every real line that carries one.
export interface TokenRun {
  tokens: string[];
  extraLeadingPx: number[];
}

export const EMPTY_RUN: TokenRun = { tokens: [], extraLeadingPx: [] };

// A continuation fragment (wordOffset set — see VerseSegment's own doc comment) already showed
// its number on the page before it, so it pays nothing here; every other verse pays the
// decoration once, on its own first raw token.
export function appendVerseToRun(run: TokenRun, verse: VerseSegment, fontSizePx: number): TokenRun {
  const tokens = rawTokensOf(verse);
  const extraLeadingPx = tokens.map((_, index) => (index === 0 && !verse.wordOffset ? verseNumberDecorationPx(verse.verseNumber, fontSizePx) : 0));
  return { tokens: [...run.tokens, ...tokens], extraLeadingPx: [...run.extraLeadingPx, ...extraLeadingPx] };
}

export function buildRun(verses: VerseSegment[], fontSizePx: number): TokenRun {
  return verses.reduce((run, verse) => appendVerseToRun(run, verse, fontSizePx), EMPTY_RUN);
}
