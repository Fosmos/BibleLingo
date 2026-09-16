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
// letter-prompt/etc. downstream the same as any other word. The hyphen itself is discarded,
// same as any other punctuation-only token.
//
// An em dash or en dash is different: it's sentence punctuation the source text sometimes
// prints with no surrounding space (e.g. Mark 11:32's `man'?"—they`, where the em dash sits
// flush against the closing quote on one side and "they" on the other) rather than part of a
// compound word, so "they" still needs to split off into its own word to type/recite — but
// unlike a hyphen, the dash character itself should stay visible rather than silently
// disappearing, so it's kept attached to the end of the word before it (`man'?"—`) instead of
// being dropped. stripPunctuation still strips it back out wherever a word needs comparing
// without punctuation, and verseClauses.ts's own trailing-dash clause-boundary check keys off
// exactly this placement.
function splitOnDashes(token: string): string[] {
  const pieces = token.split(/([–—])/);
  const words: string[] = [];
  for (const piece of pieces) {
    if (piece === "–" || piece === "—") {
      if (words.length > 0) words[words.length - 1] += piece;
      else words.push(piece);
    } else if (piece.length > 0) {
      words.push(piece);
    }
  }
  return words;
}

export function tokenizeVerseWords(text: string): string[] {
  if (!text) return [];
  return text
    .split(/\s+/)
    .flatMap((token) => token.split(/-/))
    .flatMap(splitOnDashes)
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

// A non-breaking space — a run of plain spaces collapses to one in HTML, so reserving several
// character-widths of blank space needs this instead.
const NBSP = " ";

// A single NBSP renders at roughly HALF the width of an average letter in this app's own
// serif font (measured directly against the live page: ~4.5px vs ~9.2px) — a space glyph is
// simply narrower than a letter glyph in any proportional font. Repeating NBSP once per
// character therefore reserves only about half the real word's width, letting roughly twice as
// many blank "words" crowd onto one line as would ever fit once revealed as real text — the
// whole point of reserving width in the first place (see wordLetterPlaceholder/wordOrBlank
// below) silently fails for any long run of consecutive blank words: it collapses onto far
// fewer visual lines than the same text takes once typed/spoken, instead of holding the same
// place. Repeating NBSP this many times per character closes that gap back to roughly 1:1.
const BLANK_WIDTH_MULTIPLIER = 2;

// One-past-the-index of the last word character in `word` — everything from there on is
// trailing punctuation (e.g. the `,` closing "sins," or the `,'"` closing a quoted clause).
// Mirrors the leading-punctuation scan wordLetterPlaceholder/wordOrBlank below already did,
// just from the other end, so TRAILING punctuation gets the exact same "always shown, never
// blanked" treatment leading punctuation already had — a verse's own commas/periods/quote
// marks stay visible and legible even while every letter around them is still hidden, matching
// every other blind/hint reveal in this app (see SpeakRepRevealLine.tsx).
function trailingPunctuationStart(word: string): number {
  let index = word.length;
  while (index > 0 && !HAS_WORD_CHARACTER.test(word[index - 1])) index--;
  return index;
}

// A "first letter only" or "not yet revealed" stand-in for `word` that keeps roughly the SAME
// overall width as the real word (leading AND trailing punctuation shown as-is, then either the
// first letter followed by reserved blank space for each remaining letter, or — unrevealed —
// reserved blank space for every letter including the first) — so a word rendered this way
// still occupies roughly the same horizontal space, and sits at roughly the same position, that
// the real word would have, with no dashes/underscores/dotted line drawn to mark the blank —
// just empty space. Used wherever a stage shows "just the first letters" of a verse (Draw First
// Letter, Speak's hint mode): without the reserved width, revealing only a bare single
// character per word visibly compresses the whole line, leaving every letter bunched together
// instead of where its own word actually is. `alwaysShowPunctuation` (default true, matching
// every hint-based stage above) keeps a not-yet-revealed word's own leading/trailing
// punctuation visible regardless — SRS review's own blind recall passes false instead (see
// FirstLetterVerseWords.tsx), since a genuine recall test shouldn't leak a comma or a
// pericope's own sentence structure ahead of the word it actually belongs to.
export function wordLetterPlaceholder(word: string, revealed: boolean, alwaysShowPunctuation = true): string {
  let index = 0;
  while (index < word.length && !HAS_WORD_CHARACTER.test(word[index])) index++;
  if (index >= word.length) return word;
  if (!revealed && !alwaysShowPunctuation) return NBSP.repeat(word.length * BLANK_WIDTH_MULTIPLIER);
  const prefix = word.slice(0, index);
  const trailingStart = trailingPunctuationStart(word);
  const suffix = word.slice(trailingStart);
  const coreLength = trailingStart - index;
  const blankCount = revealed ? coreLength - 1 : coreLength;
  const letter = revealed ? word[index] : "";
  return prefix + letter + NBSP.repeat(blankCount * BLANK_WIDTH_MULTIPLIER) + suffix;
}

// The whole-word counterpart to wordLetterPlaceholder above — used wherever a stage reveals
// entire words one at a time (Type First Letters, the cumulative type-check) rather than just
// first letters: the word itself once typed/spoken, or the same reserved blank space
// (no dashes/underscores, leading/trailing punctuation still shown as-is) beforehand — so
// typing or speaking a word fills it into the exact spot it was always going to sit in, rather
// than the line only growing longer at the end as each word comes in.
export function wordOrBlank(word: string, revealed: boolean): string {
  if (revealed) return word;
  let index = 0;
  while (index < word.length && !HAS_WORD_CHARACTER.test(word[index])) index++;
  if (index >= word.length) return word;
  const trailingStart = trailingPunctuationStart(word);
  const prefix = word.slice(0, index);
  const suffix = word.slice(trailingStart);
  const coreLength = trailingStart - index;
  return prefix + NBSP.repeat(coreLength * BLANK_WIDTH_MULTIPLIER) + suffix;
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
