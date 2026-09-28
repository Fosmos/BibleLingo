import type { MindMapPericopeDatum } from "@/lib/mindMapTypes";

// Whether this verse of a Mind Map hall is memorized — its chip checked, its trail filled in.
// Tracked verse by verse (not "everything up to the furthest verse reached"), so a single verse
// learned on its own never checks off the verses before it.
export function isVerseLearned(pericope: MindMapPericopeDatum, verseNumber: number): boolean {
  return pericope.learnedVerses?.includes(verseNumber) ?? false;
}
