import type { VerseSegment } from "@/types";
import { tokenizeVerseWords } from "@/lib/verseWords";
import { verseKey } from "@/lib/verseKey";

// Cumulative per-word miss counts for every verse ever reviewed, keyed by lib/verseKey.ts's
// verseKey — one running count per word position in tokenizeVerseWords(verse.text), so it
// stays aligned with every other word-indexed structure in this app (RevealedWordsList,
// useFirstLetterTyping, ...). Never reset; grows across every SRS review this verse is ever
// drilled in.
export type StumbleCounts = Record<string, number[]>;

// Folds one review's wrong word positions (local to this one verse — see
// lib/verseAccuracyBreakdown.ts's VerseAccuracy.wrongIndices) into the running counts.
export function recordStumbles(counts: StumbleCounts, verse: VerseSegment, wrongIndices: number[]): StumbleCounts {
  if (wrongIndices.length === 0) return counts;
  const key = verseKey(verse.book, verse.chapter, verse.verseNumber);
  const wordCount = tokenizeVerseWords(verse.text).length;
  const existing = counts[key];
  // A verse's own word count can't change between reviews (the same book/chapter/verse
  // always tokenizes the same way) — but defend against a saved array from a stale schema
  // anyway, padding/truncating rather than writing past its end.
  const next = existing && existing.length === wordCount ? [...existing] : new Array(wordCount).fill(0).map((_, i) => existing?.[i] ?? 0);
  for (const index of wrongIndices) {
    if (index >= 0 && index < next.length) next[index] += 1;
  }
  return { ...counts, [key]: next };
}

export type StumbleHeat = "none" | "mild" | "moderate" | "severe";

// A word's own miss count against fixed, absolute thresholds — the SAME scale for every verse
// in the app, not normalized against that verse's own worst word. A word missed 3 times reads
// exactly as "moderate" whether it sits in a heavily-reviewed psalm or a verse reviewed only
// once, so the color itself is a real, comparable signal across every verse the reader has
// ever reviewed — not just a ranking of one verse's words against each other.
export function stumbleHeat(missCount: number): StumbleHeat {
  if (missCount <= 0) return "none";
  if (missCount <= 2) return "mild";
  if (missCount <= 4) return "moderate";
  return "severe";
}
