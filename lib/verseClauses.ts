import { tokenizeVerseWords, stripPunctuation, isReferenceToken } from "@/lib/verseWords";

export interface ClauseWord {
  // Original token, punctuation intact.
  word: string;
  // Every noun/verb — approximated as "every content word" (see isContentWord below), since
  // there's no real part-of-speech tagger in this stack — bolded/capitalized in RhythmRep.
  isMain: boolean;
}

export interface VerseClause {
  words: ClauseWord[];
}

// Hand-built stop-word list: articles, conjunctions, prepositions, common pronouns (including
// KJV-archaic forms), forms of "to be"/"to have"/"to do", and "not" — everything else counts
// as a noun/verb "main" word. There's no POS tagger in this stack, so this is a rough proxy
// (adjectives and adverbs get swept in too) rather than a grammatical guarantee.
const STOP_WORDS = new Set([
  "a", "an", "the",
  "and", "but", "or", "nor", "so", "yet", "for", "because", "although", "though",
  "while", "whereas", "since", "unless", "until", "if", "as", "than", "whether",
  "in", "on", "at", "by", "with", "about", "against", "between", "into", "through",
  "during", "before", "after", "above", "below", "to", "from", "up", "down", "of",
  "off", "over", "under", "out", "upon", "unto", "within", "without", "toward", "towards",
  "i", "me", "my", "mine", "myself",
  "you", "your", "yours", "yourself", "yourselves", "thee", "thou", "thy", "thine", "ye",
  "he", "him", "his", "himself", "she", "her", "hers", "herself",
  "it", "its", "itself", "we", "us", "our", "ours", "ourselves",
  "they", "them", "their", "theirs", "themselves",
  "who", "whom", "whose", "which", "what", "this", "that", "these", "those",
  "am", "is", "are", "was", "were", "be", "been", "being", "art", "wast", "wert",
  "have", "has", "had", "having", "hast", "hadst",
  "do", "does", "did", "doing", "done", "doth", "dost",
  "not", "don't", "doesn't", "didn't", "isn't", "aren't", "wasn't", "weren't",
  "haven't", "hasn't", "hadn't",
]);

function isContentWord(word: string): boolean {
  return !STOP_WORDS.has(stripPunctuation(word).toLowerCase());
}

// A sentence boundary (., !, ?) or a minor pause mark (comma/semicolon/colon/dash) both end a
// clause, same as the verse's own last word — RhythmRep no longer renders pauses or clause
// boundaries themselves, but flattens these groups back into one word list regardless.
const SENTENCE_END_PATTERN = /[.!?][)'"]*$/;
const MINOR_PAUSE_PATTERN = /[,;:—][)'"]*$/;

function isClauseBoundary(token: string, isLastOfVerse: boolean): boolean {
  return isLastOfVerse || SENTENCE_END_PATTERN.test(token) || MINOR_PAUSE_PATTERN.test(token);
}

// Splits a verse into clauses at every pause (comma/semicolon/colon/dash, sentence-ending
// punctuation, or the verse's own end), then marks every noun/verb (see isContentWord above)
// in each clause as "main" to bold and capitalize. Reference tokens (e.g. "3:16") never
// qualify as a main word and never get their own clause split.
export function buildVerseClauses(verseText: string): VerseClause[] {
  const tokens = tokenizeVerseWords(verseText);
  const clauses: VerseClause[] = [];
  let current: ClauseWord[] = [];

  tokens.forEach((token, index) => {
    current.push({ word: token, isMain: !isReferenceToken(token) && isContentWord(token) });
    if (isClauseBoundary(token, index === tokens.length - 1)) {
      clauses.push({ words: current });
      current = [];
    }
  });
  if (current.length > 0) clauses.push({ words: current });

  return clauses;
}
