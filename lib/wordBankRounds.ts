// Cumulative blank growth across 3 word-bank rounds: round 1 blanks ~1/3 of the
// verse's words, round 2 blanks ~2/3 (adds another third on top), round 3 blanks all of them.
// TODO: Make this more random
export function getWordBankIndicesForRound(totalWords: number, round: number): number[] {
  const indices: number[] = [];
  for (let i = 0; i < totalWords; i += 1) {
    if (i % 3 < round) indices.push(i);
  }
  return indices;
}
