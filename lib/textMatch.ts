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

// Positional word-by-word comparison against the target — used to show the user
// exactly which words of the correct verse their attempt didn't match.
export function diffWords(input: string, target: string): WordDiffToken[] {
  const inputWords = normalizedWords(input);
  const targetWords = tokenizeVerseWords(target);
  const normalizedTargetWords = normalizedWords(target);
  return targetWords.map((word, index) => ({
    word,
    correct: inputWords[index] === normalizedTargetWords[index],
  }));
}

export function wordMatchRatio(input: string, target: string): number {
  const targetWords = normalizedWords(target);
  if (targetWords.length === 0) return 1;
  const inputWords = normalizedWords(input);
  const correctCount = targetWords.filter((word, index) => inputWords[index] === word).length;
  return correctCount / targetWords.length;
}

// Speech transcripts are noisier than typed input (recognition errors, dropped words),
// so spoken checks pass on a high word-match ratio rather than requiring an exact match.
export function looseMatch(input: string, target: string, threshold = 0.85): boolean {
  return wordMatchRatio(input, target) >= threshold;
}
