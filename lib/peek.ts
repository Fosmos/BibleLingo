// The lesson page's Letters / Verse help chips (DrillHelpChips.tsx): while one is on, a word the
// stage is hiding (a blank, a word not yet typed or said) shows its first letter, or in full.
export type Peek = null | "letters" | "whole";

// What a hidden word shows instead, or null to stay hidden.
export function peekText(word: string, peek: Peek): string | null {
  if (!peek) return null;
  return peek === "letters" ? (word.match(/[A-Za-z0-9]/)?.[0] ?? word.charAt(0)) : word;
}
