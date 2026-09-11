// A small, deliberately short set of logical-pivot connectives — "Therefore," "But," "So" —
// not every conjunction a translation uses. "And"/"Now"/"Then" are left out on purpose: KJV
// especially opens huge numbers of narrative verses with them as a plain continuer, not a
// real logical shift, so including them would style most of a chapter instead of highlighting
// the handful of words that actually mark a turn in the argument.
const STRUCTURAL_WORDS = new Set([
  "Therefore",
  "But",
  "So",
  "For",
  "Yet",
  "Because",
  "However",
  "Nevertheless",
  "Moreover",
  "Wherefore",
  "Thus",
]);

// True for a CAPITALIZED structural/connective word — a lightweight heuristic for "this word
// opens a new clause," not real grammar parsing. Matching only the capitalized form catches a
// genuine sentence-initial connective ("Therefore, I say...") while leaving the same word's
// ordinary mid-sentence use ("...and therefore...") untouched, since capitalization is the one
// signal a translator already gives for this without needing real clause parsing.
export function isStructuralWord(word: string): boolean {
  const bare = word.replace(/[^\w]/g, "");
  return STRUCTURAL_WORDS.has(bare);
}
