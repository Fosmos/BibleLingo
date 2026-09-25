// The actual Pass 1/2 line-splitting algorithm behind lib/senseLines.ts's own public API — split
// out purely to keep that file under this codebase's own 200-line file cap (see CLAUDE.md). See
// lib/senseLines.ts's own top-of-file doc comment for what each pass does and why. Punctuation
// only, nothing else — an earlier conjunction/relative-pronoun fallback (splitting a
// still-too-long punctuation-bounded clause again at "and"/"that"/etc.) was dropped: this file
// no longer measures or cares about line length at all, so a run-on clause with no punctuation
// of its own just stays one line, however long, and falls back on the browser's own real wrap
// (see SenseLineRow.tsx's own hanging indent) if it genuinely can't fit.

// Pass 1 — split AFTER a real SENTENCE end (+ closing quote), before the next word — the one
// break stronger than a comma: a full stop is a real sentence boundary regardless of how short
// either side is. Semicolon/colon deliberately do NOT belong here even though they're also
// "terminal-looking" punctuation — they're a MINOR pause (see Pass 2's own MINOR_BREAK_PATTERN
// below), not a sentence end.
const HARD_BREAK_PATTERN = /(?<=[.?!]['"’”]*)\s+/;

// Pass 2's own minor breaks — a comma, semicolon, or colon (+ optional closing quote), always
// followed by whitespace in real verse text, or an em-dash, which this app's own ESV source
// renders BOTH ways depending on the verse: tight, no surrounding spaces at all (e.g. "to whom
// you bore witness—look, he" — one word "witness—look,"), and, elsewhere (some Psalms), with a
// real space after it. Matched against the raw text/character position rather than
// word-tokenized, so an em-dash buried in the MIDDLE of what whitespace-tokenizing would
// otherwise treat as a single word is still a real candidate split point; a comma/semicolon/
// colon still requires trailing whitespace so a mid-word typo (or a verse-reference colon like
// "1:2") doesn't count.
const MINOR_BREAK_PATTERN = /[,;:]['"’”]*(?=\s)|—/g;

interface MinorBreakCandidate {
  // A comma/semicolon/colon's own position is right AFTER the mark/quote — kept attached to the
  // first half, same convention hard punctuation uses. An em-dash's own position is AT the dash
  // itself — kept attached to the START of the second half instead (a dash never has real
  // whitespace reliably on both sides to trim, so the front of a piece is the one position that
  // stays unambiguous either way it's rendered).
  position: number;
  emDash: boolean;
}

function minorBreakCandidates(text: string): MinorBreakCandidate[] {
  const candidates: MinorBreakCandidate[] = [];
  for (const match of text.matchAll(MINOR_BREAK_PATTERN)) {
    const emDash = match[0] === "—";
    candidates.push({ position: emDash ? (match.index ?? 0) : (match.index ?? 0) + match[0].length, emDash });
  }
  return candidates;
}

// Pass 2 — split at EVERY comma/semicolon/colon/em-dash in this Pass-1 sentence, unconditionally
// — this app's "sense line" convention is one clause/pause per line, not a wrap-avoidance
// heuristic. Candidates at the very start/end of `text` are excluded (an empty half either side
// isn't a real split); every other one becomes its own piece, in order.
function splitAtEveryMinorBreak(text: string): string[] {
  const candidates = minorBreakCandidates(text).filter((c) => c.position > 0 && c.position < text.length);
  if (candidates.length === 0) return [text];
  const pieces: string[] = [];
  let cursor = 0;
  for (const candidate of candidates) {
    pieces.push(text.slice(cursor, candidate.position));
    cursor = candidate.position;
  }
  pieces.push(text.slice(cursor));
  return pieces.map((piece) => (piece.startsWith("—") ? piece : piece.trimStart())).filter((piece) => piece.length > 0);
}

// The full clause split: Pass 1 (sentence end) → Pass 2 (every minor punctuation mark). Nothing
// else — see this file's own top-of-file doc comment.
export function splitIntoLines(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const sentences = trimmed.split(HARD_BREAK_PATTERN).filter(Boolean);
  return sentences
    .flatMap((sentence) => splitAtEveryMinorBreak(sentence))
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
