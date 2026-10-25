// Sense lines: a verse broken only at its punctuation (, ; : . ? ! and before an em-dash), then
// evened out — a line under MIN_WORDS joins its neighbour (across the weaker of its two pauses), and
// a line over LONG_WORDS is split in two where a reader would pause. That split point gets a cost per
// break between two words: cheap before a word that opens a clause ("and", "that", "who"...) and, a
// little less, before a helping verb or a preposition ("has", "in", "through"...); dear after a word
// that can't end a phrase ("the", "of", "his"...), which would leave the line hanging.

// A unit of the sentence: a word, or the part of a dashed word from its em-dash on
// ("witness—look," → "witness", "—look,"), so a line can break at the dash.
interface Unit {
  text: string;
  // Joined to the unit before it with a space (false for the half that starts at an em-dash).
  spaced: boolean;
}

// Words that open a clause (conjunctions, relatives) — the best place to start a line. "for" and
// "as" are left to the prepositions below: mid-sentence they're usually one ("pray for those",
// "glory as of the only Son"), and as conjunctions they follow punctuation, a cheap break anyway.
const OPENS_CLAUSE = new Set([
  "and", "but", "or", "nor", "so", "yet", "that", "who", "whom", "whose", "which", "what", "because", "when", "whenever",
  "where", "while", "if", "though", "although", "unless", "until", "till", "since", "lest", "how", "then", "therefore",
  "neither", "according",
]);

// Words that open a smaller phrase (prepositions) — a fair place to start a line. "of" isn't one:
// "the law of the Spirit of life" holds together, so breaking before it costs more instead.
const OPENS_PHRASE = new Set([
  "in", "into", "with", "within", "without", "through", "by", "from", "to", "unto", "upon", "on", "before", "after", "against",
  "among", "over", "under", "above", "beyond", "toward", "towards", "even", "not", "for", "as",
]);

const PRONOUNS = new Set(["him", "her", "me", "you", "us", "them", "it", "thee", "himself", "themselves"]);

// Helping verbs, which often start the predicate after a long subject ("…of life / has set you free").
const STARTS_PREDICATE = new Set(["has", "have", "had", "is", "was", "are", "were", "will", "shall", "should", "may", "might", "must", "can", "could", "would"]);

// Words that can't end a phrase (articles, prepositions, possessives, helping verbs).
const NEEDS_MORE = new Set([
  "the", "a", "an", "of", "to", "in", "into", "on", "for", "with", "by", "from", "at", "unto", "upon", "through", "and", "or",
  "but", "nor", "his", "her", "my", "your", "thy", "our", "their", "its", "this", "these", "those", "who", "which", "whom",
  "whose", "that", "not", "no", "is", "was", "do", "does", "did", "be", "are", "were", "am", "has", "have", "had", "will", "shall", "may", "might",
  "can", "could", "would", "should", "must", "let", "as", "so", "than", "o", "every", "all", "very",
]);

const ENDS_PAUSE = /[,;:]['"’”)]*$/;
const ENDS_SENTENCE = /[.?!]['"’”)]*$/;

// The word with its punctuation stripped, lower-cased ("“Behold," → "behold").
const bare = (text: string) => text.toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, "");

// A sense line has at least this many words (unless the whole verse is shorter); one longer than
// LONG_WORDS is split in two.
const MIN_WORDS = 4;
const LONG_WORDS = 12;

// The cost of a line break just before units[index].
function breakCost(units: Unit[], index: number): number {
  const before = units[index - 1].text;
  const after = units[index];
  if (ENDS_SENTENCE.test(before) || ENDS_PAUSE.test(before)) return -4;
  if (!after.spaced) return -3;
  const next = bare(after.text);
  let cost = 7;
  // A word with punctuation after it ends a phrase ("things hoped / for, the…") — never an opener.
  const opener = !ENDS_PAUSE.test(after.text) && !ENDS_SENTENCE.test(after.text);
  if (opener && OPENS_CLAUSE.has(next)) cost = 1;
  // "believes in him" — a preposition with just a pronoun after it stays with the word before.
  else if (opener && OPENS_PHRASE.has(next)) cost = PRONOUNS.has(bare(units[index + 1]?.text ?? "")) ? 7 : 4;
  else if (STARTS_PREDICATE.has(next)) cost = 3;
  else if (next === "of") cost = 18;
  if (NEEDS_MORE.has(bare(before))) cost += 14;
  // A name mid-phrase ("…who love / God all things…") belongs with the words before it.
  if (/^[^A-Za-z]*[A-Z]/.test(after.text) && !["i", "o"].includes(next)) cost += 8;
  return cost;
}

function unitsOf(sentence: string): Unit[] {
  return sentence
    .split(/\s+/)
    // A translation's paragraph mark (the KJV's "¶") isn't a word to show or count.
    .filter((word) => word && word !== "¶")
    .flatMap((word) =>
      word
        .split(/(?=—)/)
        .filter(Boolean)
        .map((text, index) => ({ text, spaced: index === 0 })),
    );
}

const join = (units: Unit[]) => units.map((unit, index) => (index > 0 && unit.spaced ? ` ${unit.text}` : unit.text)).join("");

// Each unit is a word — tokenizeVerseWords counts the part of a dashed word from its em-dash on as one too.
const words = (segment: Unit[]) => segment.length;

// How strong the pause is at the end of a segment: a sentence's end, a semicolon or colon, a comma,
// else none (an em-dash, or the verse's end) — a short line joins across the weaker side.
function pauseAfter(segment: Unit[]): number {
  const last = segment[segment.length - 1].text;
  if (ENDS_SENTENCE.test(last)) return 3;
  if (/[;:]['"’”)]*$/.test(last)) return 2;
  return /,['"’”)]*$/.test(last) ? 1 : 0;
}

// A long line's best split into two, each at least MIN_WORDS words: the cheapest break, kept near the middle.
function splitLong(segment: Unit[]): Unit[][] {
  const total = words(segment);
  let best = { cost: Infinity, at: -1 };
  for (let index = MIN_WORDS; index <= total - MIN_WORDS; index++) {
    const [before, after] = [index, total - index];
    const cost = breakCost(segment, index) + Math.abs(before - after);
    if (cost < best.cost) best = { cost, at: index };
  }
  return best.at < 0 ? [segment] : [segment.slice(0, best.at), segment.slice(best.at)];
}

// A verse's sense lines (see this file's doc comment).
export function naturalSenseLines(text: string): string[] {
  const units = unitsOf(text);
  if (!units.length) return [];
  // At its punctuation: after a word ending in a pause or a sentence's end, and before an em-dash.
  const segments: Unit[][] = [[]];
  units.forEach((unit, index) => {
    if (index > 0 && (!unit.spaced || ENDS_PAUSE.test(units[index - 1].text) || ENDS_SENTENCE.test(units[index - 1].text))) segments.push([]);
    segments[segments.length - 1].push(unit);
  });
  // The shortest line under MIN_WORDS joins a neighbour, over the weaker pause, until none is left.
  for (;;) {
    const short = segments.map((segment, index) => ({ index, size: words(segment) })).filter((entry) => entry.size < MIN_WORDS && segments.length > 1);
    if (!short.length) break;
    const { index } = short.sort((a, b) => a.size - b.size)[0];
    const intoPrevious = index > 0 && (index === segments.length - 1 || pauseAfter(segments[index - 1]) <= pauseAfter(segments[index]));
    const at = intoPrevious ? index - 1 : index;
    segments.splice(at, 2, [...segments[at], ...segments[at + 1]]);
  }
  return segments.flatMap((segment) => (words(segment) > LONG_WORDS ? splitLong(segment) : [segment])).map(join);
}
