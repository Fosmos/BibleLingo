import { stripPunctuation } from "@/lib/verseWords";

// A short, hand-picked list of function words (articles, conjunctions, common prepositions,
// pronouns, auxiliary verbs) — everything else counts as "important" for blanking-priority
// purposes (see blankIndicesImportantFirst below). Deliberately conservative/short rather than a
// full NLP stopword list: this only ever needs to rank words within ONE short verse at a time,
// not classify text in general, and a false "important" (a function word left in) costs far less
// than a false "unimportant" (a real content word skipped).
const LOW_IMPORTANCE_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "nor", "for", "so", "yet",
  "of", "in", "on", "at", "to", "by", "with", "from", "as", "into", "unto", "upon",
  "is", "are", "was", "were", "be", "been", "being", "am",
  "i", "you", "we", "he", "she", "it", "they", "me", "him", "her", "us", "them",
  "my", "your", "his", "its", "our", "their",
  "that", "this", "these", "those", "which", "who", "whom", "whose",
  "not", "no", "do", "does", "did", "has", "have", "had",
  "will", "shall", "may", "might", "can", "could", "would", "should", "must",
  "up", "out", "if", "then", "than", "also", "too", "very", "just", "there", "here",
]);

export function isImportantWord(word: string): boolean {
  const stripped = stripPunctuation(word).toLowerCase();
  return stripped.length > 0 && !LOW_IMPORTANCE_WORDS.has(stripped);
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Which word indices to blank for a "partial removal" rep — content/meaning-bearing words (see
// isImportantWord) are prioritized first (real recall, not just filling in "the"/"of"), then
// filled up to `targetCount` with a random selection of the remaining (low-importance) words if
// there aren't enough important ones alone. Returns indices in ascending (verse-reading) order,
// regardless of the order they were chosen in, so a caller can blank left-to-right without
// re-sorting. `targetCount >= words.length` (the "100% removed" rep) just returns every index.
export function blankIndicesImportantFirst(words: string[], targetCount: number): number[] {
  const indices = words.map((_, index) => index);
  if (targetCount >= words.length) return indices;
  const important = indices.filter((index) => isImportantWord(words[index]));
  const minor = shuffled(indices.filter((index) => !isImportantWord(words[index])));
  const chosen = important.length >= targetCount ? important.slice(0, targetCount) : [...important, ...minor.slice(0, targetCount - important.length)];
  return chosen.sort((a, b) => a - b);
}
