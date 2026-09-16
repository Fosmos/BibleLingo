// ListenVerseRep's own word list — deliberately NOT tokenizeVerseWords.ts's tokenization
// (which drops punctuation-only tokens and doesn't track character position at all): a
// SpeechSynthesisUtterance's onboundary event reports a `charIndex` straight into the exact
// string handed to it, so highlighting needs a word list whose own offsets are guaranteed to
// line up with that same string, not a cleaned-up token list built for typing/scoring drills.
export interface WordOffset {
  word: string;
  startChar: number;
}

export function tokenizeWithOffsets(text: string): WordOffset[] {
  const words: WordOffset[] = [];
  const pattern = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    words.push({ word: match[0], startChar: match.index });
  }
  return words;
}

// Which word a boundary event's charIndex falls inside — the last word whose own start is at
// or before it. `words` is assumed sorted by startChar (tokenizeWithOffsets above always
// returns it that way).
export function wordIndexForCharIndex(words: WordOffset[], charIndex: number): number {
  let index = 0;
  for (let i = 0; i < words.length; i++) {
    if (words[i].startChar <= charIndex) index = i;
    else break;
  }
  return index;
}
