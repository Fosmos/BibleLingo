// Character-level fuzzy matching for the Speak stage's own rolling speech transcript — a
// distinct, complementary tool from lib/textMatch.ts's own LCS WORD-alignment (which drives
// the live per-word reveal and diff display): this one collapses the whole comparison down to
// a single 0-100 similarity score, the number useSpeakRepMic.ts's own pass/fail gate actually
// thresholds against.
function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Minimum single-character insert/delete/substitute edits to turn `a` into `b` — the standard
// dynamic-programming table, kept as a single rolling row (not the full matrix) since a cell
// only ever needs the row directly above it.
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let previousRow = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const currentRow = [i];
    for (let j = 1; j <= b.length; j++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      currentRow[j] = Math.min(
        currentRow[j - 1] + 1, // insertion
        previousRow[j] + 1, // deletion
        previousRow[j - 1] + substitutionCost, // substitution
      );
    }
    previousRow = currentRow;
  }
  return previousRow[b.length];
}

// A 0-100 similarity score between `transcript` (the rolling speech-recognition text, interim
// or final) and `target` (the verse) — strips punctuation and lowercases both first
// (normalizeForMatch), then expresses the edit distance as a fraction of the LONGER of the two
// normalized strings' own length, the standard normalization for turning a raw edit count into
// a length-independent percentage (a single typo on a short phrase should cost more than the
// same one edit on a long verse).
export function levenshteinMatchPercent(transcript: string, target: string): number {
  const a = normalizeForMatch(transcript);
  const b = normalizeForMatch(target);
  if (a.length === 0 && b.length === 0) return 100;
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 100;
  const distance = levenshteinDistance(a, b);
  return Math.round((1 - distance / maxLength) * 100);
}
