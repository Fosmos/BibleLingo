// Splits verse text into the words a user actually needs to memorize/type — used by every
// word-by-word drill (typing, first-letter, word bank) and the review chain. Source text
// occasionally carries a punctuation mark (e.g. a quotation mark around quoted Scripture in
// Mark 1:2) as its own whitespace-separated token, which would otherwise become a "word" the
// user has to enter on its own. A token only counts as a word if it has at least one letter
// or digit — this still keeps verse-reference tokens like "3:16" (digits present) while
// dropping stray punctuation-only tokens.
const HAS_WORD_CHARACTER = /[\p{L}\p{N}]/u;

// A hyphen always joins two otherwise-separate words (e.g. "well-being", "God-fearing") — the
// word after it is its own entry, not part of a compound token, so it gets its own beat/tile/
// letter-prompt/etc. downstream the same as any other word.
export function tokenizeVerseWords(text: string): string[] {
  if (!text) return [];
  return text
    .split(/\s+/)
    .flatMap((token) => token.split(/-/))
    .filter((token) => HAS_WORD_CHARACTER.test(token));
}

// A word can still carry leading punctuation (e.g. a quotation mark opening a quoted verse
// like Mark 1:2 — `"As` or `"Behold,`) even after tokenizeVerseWords drops punctuation-only
// tokens. First-letter drills key off this rather than word[0] so the user is never asked to
// type a quotation mark (or any other punctuation) as if it were a letter.
export function firstWordCharacter(word: string): string | undefined {
  for (const character of word) {
    if (HAS_WORD_CHARACTER.test(character)) return character;
  }
  return undefined;
}

// Strips everything but letters/digits/internal apostrophes — used wherever a word needs to
// be compared without surrounding punctuation (e.g. a quotation mark opening a quoted verse,
// or a trailing comma), while keeping contractions like "don't" intact. Hyphens are already
// split into separate tokens by tokenizeVerseWords above, so there's never a genuine internal
// hyphen left to preserve here by the time this runs.
const NON_WORD_CHARACTER = /[^\p{L}\p{N}']/gu;

export function stripPunctuation(word: string): string {
  return word.replace(NON_WORD_CHARACTER, "");
}

// A verse-reference token (e.g. "3:16"), present as its own word when verse references are
// turned on — see applyReferencePreference. Centralized here since several drills need to
// special-case these tokens (they have no natural "first letter"/single-character identity).
const REFERENCE_PATTERN = /^(\d+):(\d+)$/;

export function isReferenceToken(word: string): boolean {
  return REFERENCE_PATTERN.test(word);
}
