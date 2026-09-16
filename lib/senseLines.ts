// Deterministic sense-line parsing for Bible verse text — breaks a passage into syntactically
// balanced lines (one clause/phrase per line, the way a printed sense-line Bible does). The only
// UNCONDITIONAL clause boundary is hard punctuation — a conjunction never splits a line on its
// own, no matter how natural the boundary reads, because that's exactly what was producing
// short, awkward fragments the min-length guardrail then had to paper back together (e.g.
// "and the earth." stranded on its own line just because "and" is technically a conjunction).
// A subordinating conjunction/relative pronoun only ever comes into play as the PREFERRED way to
// break up a line that's already too long (see enforceMaxLength) — the same role
// MAX_LENGTH_PREPOSITIONS already played, just tried first.

// Hard punctuation ending a word — the strongest, least ambiguous clause boundary. Splits AFTER
// the mark (and any closing quote immediately following it), before the next word.
const HARD_PUNCTUATION_SPLIT = /(?<=[.,;:?!]['"’”]*)\s+/;

// Guardrails.
const MIN_LINE_WORDS = 3;
const MAX_LINE_WORDS = 9;
const MAX_LENGTH_PREPOSITIONS = ["in", "by", "with", "for", "through"];
// Subordinating conjunctions + relative pronouns — checked BEFORE MAX_LENGTH_PREPOSITIONS
// whenever a line needs to be forced under MAX_LINE_WORDS, since a conjunction is a cleaner,
// more natural clause boundary than a bare preposition when one's available. "and" (a
// COORDINATING conjunction, unlike the rest of this list) belongs here too, not in this file's
// own top-of-file "and never splits on its own" rule above — that rule is about "and" ever
// being an UNCONDITIONAL trigger the way hard punctuation is, which really did read badly (see
// that comment's own "and the earth." example, from back when "and" split a line regardless of
// length). Here it only ever fires as this SAME forced-max-length fallback every other entry in
// this list already is — enforceMinLength below still folds away anything that comes out too
// short, the same safety net every other trigger in this list already relies on.
const MAX_LENGTH_CONJUNCTIONS = [
  "although", "and", "as", "as if", "as long as", "as though", "because", "before", "even if",
  "even though", "if", "in order that", "once", "provided that", "rather than", "since",
  "so that", "than", "that", "though", "unless", "until", "when", "whenever", "where",
  "wherever", "whereas", "while", "who", "whom", "whose", "which",
];

function bareWord(word: string): string {
  return word.toLowerCase().replace(/[^\w]/g, "");
}

function wordsOf(text: string): string[] {
  return text.split(/\s+/).filter((word) => word.length > 0);
}

function phraseMatchLength(words: string[], index: number, phrases: string[]): number {
  const sorted = [...phrases].sort((a, b) => b.split(" ").length - a.split(" ").length);
  for (const phrase of sorted) {
    const phraseWords = phrase.split(" ");
    const slice = words
      .slice(index, index + phraseWords.length)
      .map(bareWord)
      .join(" ");
    if (slice === phrase) return phraseWords.length;
  }
  return 0;
}

// The word index closest to `target` where one of `phrases` starts (never index 0 — a line never
// "splits" before its own first word) — or -1 if none occurs anywhere in `words`. Shared by
// enforceMaxLength's conjunction and preposition passes below.
function closestTriggerIndex(words: string[], target: number, phrases: string[]): number {
  let splitAt = -1;
  let bestDistance = Infinity;
  for (let index = 1; index < words.length; index++) {
    if (phraseMatchLength(words, index, phrases) === 0) continue;
    const distance = Math.abs(index - target);
    if (distance < bestDistance) {
      bestDistance = distance;
      splitAt = index;
    }
  }
  return splitAt;
}

// Forces any line over MAX_LINE_WORDS to split closest to the limit — preferring a subordinating
// conjunction/relative pronoun (MAX_LENGTH_CONJUNCTIONS, a cleaner clause boundary) over a bare
// preposition (MAX_LENGTH_PREPOSITIONS), recursing in case the remainder is itself still too
// long. Neither trigger occurring anywhere in the line falls back to a hard split at the cap
// rather than leaving a run-on line in place.
function enforceMaxLength(line: string): string[] {
  const words = wordsOf(line);
  if (words.length <= MAX_LINE_WORDS) return [line];
  const conjunctionSplit = closestTriggerIndex(words, MAX_LINE_WORDS, MAX_LENGTH_CONJUNCTIONS);
  const prepositionSplit = closestTriggerIndex(words, MAX_LINE_WORDS, MAX_LENGTH_PREPOSITIONS);
  const splitAt = conjunctionSplit !== -1 ? conjunctionSplit : prepositionSplit !== -1 ? prepositionSplit : MAX_LINE_WORDS;
  const first = words.slice(0, splitAt).join(" ");
  const rest = words.slice(splitAt).join(" ");
  return [first, ...enforceMaxLength(rest)];
}

// One parsed line plus whether it's a forced continuation of the line before it (see
// splitIntoLines below) rather than a real clause boundary.
interface RawLine {
  text: string;
  continuation: boolean;
}

// Folds any line under MIN_LINE_WORDS into its neighbor — the preceding line per the spec, or
// (only for a too-short FIRST line, which has no preceding line yet) the following one. A
// merged-away line's own `continuation` tag goes with it (the survivor keeps its own), since
// once two lines are joined back into one there's only the survivor's tag left to mean anything.
function enforceMinLength(lines: RawLine[]): RawLine[] {
  const merged: RawLine[] = [];
  for (const line of lines) {
    if (wordsOf(line.text).length < MIN_LINE_WORDS && merged.length > 0) {
      const last = merged[merged.length - 1];
      merged[merged.length - 1] = { ...last, text: `${last.text} ${line.text}` };
    } else {
      merged.push(line);
    }
  }
  if (merged.length > 1 && wordsOf(merged[0].text).length < MIN_LINE_WORDS) {
    merged.splice(0, 2, { ...merged[0], text: `${merged[0].text} ${merged[1].text}` });
  }
  return merged;
}

// The full clause split, tagging each resulting line as a continuation whenever enforceMaxLength
// had to carve it off the SAME original punctuation-delimited piece purely to fit the page — the
// first piece enforceMaxLength returns for a given `raw` entry is the real start of that clause;
// every one after it is a forced continuation, not a new clause boundary (see SenseLineClause's
// own `continuation` field for how that's rendered).
function splitIntoLines(text: string): RawLine[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const raw = trimmed.split(HARD_PUNCTUATION_SPLIT).filter(Boolean);
  const maxEnforced: RawLine[] = raw.flatMap((piece) =>
    enforceMaxLength(piece).map((line, index) => ({ text: line, continuation: index > 0 })),
  );
  return enforceMinLength(maxEnforced)
    .map((line) => ({ ...line, text: line.text.trim() }))
    .filter((line) => line.text.length > 0);
}

// See this file's own top-of-file doc comment.
export function parseToSenseLines(text: string): string[] {
  return splitIntoLines(text).map((line) => line.text);
}

// Shared with ChapterPageContent.tsx's own rendering so pagination's line-budget math and the
// real on-screen layout can never drift apart — a page is packed to fit exactly the clause
// blocks that will actually render at this same width. Every clause renders flush at the SAME
// left margin as the verse's own first line, regardless of how it was split off (comma,
// conjunction, or relative pronoun) — only a genuine mid-clause line WRAP (a browser-wrapped
// second line of the same clause, or enforceMaxLength's own forced continuation) hangs indented
// under that clause's own first word (see HANGING_INDENT_PX/SenseLineRow.tsx).
export const HANGING_INDENT_PX = 24; // 1.5rem — the wrapped-line hanging indent every clause gets

// The real width left for a clause's own text after its own hanging indent eats into the page's
// column — used for both real word-wrap measurement (see lib/chapterPagination.ts) and the CSS
// the clause itself renders with.
export function clauseColumnWidthPx(columnWidthPx: number): number {
  return Math.max(columnWidthPx - HANGING_INDENT_PX, 40);
}

export interface SenseLineClause {
  text: string;
  // True when this line is a forced continuation of the line before it — enforceMaxLength split
  // one over-long clause across two+ lines purely to fit the page, not because a real clause
  // boundary landed there. Rendered with a hanging indent (SenseLineVerse.tsx renders it the
  // same way a browser-wrapped continuation of the same clause would look) rather than flush at
  // the left margin, so it reads as "the rest of the line above," not a new clause.
  continuation: boolean;
}

// parseToSenseLines' own real lines, as full SenseLineClause records — see that interface's own
// doc comment for what `continuation` means.
export function parseSenseLines(text: string): SenseLineClause[] {
  return splitIntoLines(text);
}
