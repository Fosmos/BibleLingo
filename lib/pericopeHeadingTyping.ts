import { formatChapterLabel } from "@/lib/chapterContent";
import { tokenizeVerseWords, firstWordCharacter } from "@/lib/verseWords";

// One typing step for PericopeHeadingTypeRep — either a whole word (typed by first letter,
// same convention as every other first-letter drill) or a single digit of the chapter/verse
// reference (typed digit-by-digit, e.g. "21" needs a "2" then a "1" — see buildHeadingUnits
// below). `prefix` is inserted once, un-typed, right before this unit's own `display` — the
// punctuation/spacing that recombines the reference into "5:21-43" as its digits get typed,
// rather than typing the colon/dash themselves.
export interface HeadingTypeUnit {
  prefix: string;
  display: string;
  // Already lowercased — compare a typed character against this with typed.toLowerCase().
  typeChar: string;
}

function wordUnits(text: string, firstPrefix: string): HeadingTypeUnit[] {
  return tokenizeVerseWords(text).map((word, index) => ({
    prefix: index === 0 ? firstPrefix : " ",
    display: word,
    typeChar: (firstWordCharacter(word) ?? "").toLowerCase(),
  }));
}

function digitUnits(value: number, firstPrefix: string): HeadingTypeUnit[] {
  return String(value)
    .split("")
    .map((digit, index) => ({ prefix: index === 0 ? firstPrefix : "", display: digit, typeChar: digit }));
}

// Book names can be multi-word and can themselves start with a digit (e.g. "1 Corinthians"),
// so the reference's own chapter/verse digits are found by splitting formatChapterLabel's own
// output at its last space rather than scanning the book name for digits.
function bookNameUnits(book: string, chapter: number): HeadingTypeUnit[] {
  const chapterLabel = formatChapterLabel(book, chapter);
  const lastSpaceIndex = chapterLabel.lastIndexOf(" ");
  return wordUnits(chapterLabel.slice(0, lastSpaceIndex), "");
}

// Builds the full typing sequence for a pericope heading — e.g. "Mark 5:21-43: A Call to
// Persevere" types as M(ark) 5 2 1 4 3 A(...) C(all) t(o) P(ersevere), with the book name and
// every heading word revealed a whole word at a time (first letter only, as usual) but the
// chapter/verse reference revealed one digit at a time — see PericopeInfo for why book/
// chapter/startVerse/endVerse are passed as their own fields rather than parsed back out of
// the already-formatted `label` string.
export function buildHeadingUnits(book: string, chapter: number, startVerse: number, endVerse: number, heading: string): HeadingTypeUnit[] {
  const units = [...bookNameUnits(book, chapter), ...digitUnits(chapter, " "), ...digitUnits(startVerse, ":")];
  if (endVerse !== startVerse) units.push(...digitUnits(endVerse, "-"));
  units.push(...wordUnits(heading, ": "));
  return units;
}
