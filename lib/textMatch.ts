import type { WordDiffToken } from "@/types";
import { tokenizeVerseWords } from "@/lib/verseWords";

function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizedWords(input: string): string[] {
  return normalize(input).split(" ").filter(Boolean);
}

export function fuzzyMatch(input: string, target: string): boolean {
  return normalize(input) === normalize(target);
}

// Aligns two word lists via longest common subsequence rather than raw array position — a
// straight `a[index] === b[index]` comparison (the previous approach here) treats one
// accidentally inserted or dropped word as shifting EVERY word after it out of position, so
// the rest of an otherwise-correct attempt reads as entirely wrong. LCS instead finds the
// best matching subsequence, so a single extra/missing/substituted word only ever costs
// that one word — everything correctly said before and after it still lines up. Computed
// once for both directions at once: `matchedA[i]` is true wherever `a[i]` took part in the
// alignment, `matchedB[j]` likewise for `b[j]` — a word can only ever be marked correct on
// one side if its counterpart on the other side is too, so the two arrays are always
// consistent with each other.
function lcsAlign(a: string[], b: string[]): { matchedA: boolean[]; matchedB: boolean[] } {
  const n = a.length;
  const m = b.length;
  // dp[i][j] = length of the LCS of a[i..] and b[j..].
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const matchedA = new Array<boolean>(n).fill(false);
  const matchedB = new Array<boolean>(m).fill(false);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      matchedA[i] = true;
      matchedB[j] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  return { matchedA, matchedB };
}

// tokenizeVerseWords splits a hyphenated word ("well-being") into two separate word tokens;
// normalize's own punctuation strip instead just deletes the hyphen with no replacement
// space ("wellbeing", one token) — so the two can disagree on how many words a verse has.
// Re-deriving the normalized-comparison list FROM tokenizeVerseWords's own token list (one
// normalize pass per already-split token, never re-splitting) keeps both arrays the same
// length and positionally aligned, so index-for-index they always refer to the same word.
function normalizedTokens(words: string[]): string[] {
  return words.map((word) => normalize(word));
}

// Word-by-word comparison against the target — used to show the user exactly which words of
// the correct verse their attempt didn't match. See lcsAlign above for why this aligns by
// best-matching subsequence rather than raw position.
export function diffWords(input: string, target: string): WordDiffToken[] {
  const inputWords = normalizedWords(input);
  const targetWords = tokenizeVerseWords(target);
  const normalizedTargetWords = normalizedTokens(targetWords);
  const { matchedA } = lcsAlign(normalizedTargetWords, inputWords);
  return targetWords.map((word, index) => ({
    word,
    correct: matchedA[index] ?? false,
  }));
}

// Same alignment as diffWords, but returns BOTH sides: the target verse (which of its words
// the attempt actually hit) AND the attempt itself, in the words as spoken/typed (which of
// those words were actually used, as opposed to an extra/misheard one) — lets a caller show
// "here's what we heard" right next to "here's the correct verse" with each one's own wrong
// words called out, rather than only ever showing the target's side of the story.
export function diffAttempt(input: string, target: string): { spoken: WordDiffToken[]; verse: WordDiffToken[] } {
  const spokenWords = input.trim().split(/\s+/).filter(Boolean);
  const normalizedSpokenWords = normalizedTokens(spokenWords);
  const targetWords = tokenizeVerseWords(target);
  const normalizedTargetWords = normalizedTokens(targetWords);
  const { matchedA: targetMatched, matchedB: spokenMatched } = lcsAlign(normalizedTargetWords, normalizedSpokenWords);
  return {
    spoken: spokenWords.map((word, index) => ({ word, correct: spokenMatched[index] ?? false })),
    verse: targetWords.map((word, index) => ({ word, correct: targetMatched[index] ?? false })),
  };
}

export function wordMatchRatio(input: string, target: string): number {
  // Same tokenize-then-normalize-each-token basis as diffWords/diffAttempt (see
  // normalizedTokens above) rather than normalizing the whole target string at once, so a
  // hyphenated word can't quietly change the target's own word count between this ratio and
  // what the diff display actually shows.
  const targetWords = normalizedTokens(tokenizeVerseWords(target));
  if (targetWords.length === 0) return 1;
  const inputWords = normalizedWords(input);
  const { matchedA } = lcsAlign(targetWords, inputWords);
  const correctCount = matchedA.filter(Boolean).length;
  return correctCount / targetWords.length;
}

// Speech transcripts are noisier than typed input (recognition errors, dropped words),
// so spoken checks pass on a high word-match ratio rather than requiring an exact match.
export function looseMatch(input: string, target: string, threshold = 0.85): boolean {
  return wordMatchRatio(input, target) >= threshold;
}
