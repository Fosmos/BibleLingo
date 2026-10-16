// Natural sense lines: one sentence divided into lines of about 4–6 words, broken where a reader
// would pause. Every possible break between two words gets a cost, and so does every line's
// length; dynamic programming then picks the division with the lowest total. A break is cheap at
// punctuation, before a word that opens a clause ("and", "that", "who"...) and, a little less,
// before a preposition ("in", "through"...).
// It is dear after a word that can't end a phrase ("the", "of", "his"...), because those leave the
// line hanging. Lengths of 4–6 words cost nothing, 3 or 7 a little, and anything else a lot.

// A unit of the sentence: a word, or the part of a dashed word from its em-dash on
// ("witness—look," → "witness", "—look,"), so a line can break at the dash.
interface Unit {
  text: string;
  // Joined to the unit before it with a space (false for the half that starts at an em-dash).
  spaced: boolean;
}

// Words that open a clause (conjunctions, relatives) — the best place to start a line.
const OPENS_CLAUSE = new Set([
  "and", "but", "or", "nor", "for", "so", "yet", "that", "who", "whom", "whose", "which", "what", "because", "when", "whenever",
  "where", "while", "if", "though", "although", "unless", "until", "till", "since", "as", "lest", "how", "then", "therefore",
  "neither", "according",
]);

// Words that open a smaller phrase (prepositions) — a fair place to start a line. "of" isn't one:
// "the law of the Spirit of life" holds together, so breaking before it costs more instead.
const OPENS_PHRASE = new Set([
  "in", "into", "with", "within", "without", "through", "by", "from", "to", "unto", "upon", "on", "before", "after", "against",
  "among", "over", "under", "above", "beyond", "toward", "towards", "even", "not",
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

// Each line length's cost: 4–6 words is the aim.
const LENGTH_COST = [Infinity, 20, 10, 4, 0, 0, 0, 6, 12, 20];
const MAX_LINE = LENGTH_COST.length - 1;

// The cost of a line break just before units[index].
function breakCost(units: Unit[], index: number): number {
  const before = units[index - 1].text;
  const after = units[index];
  if (ENDS_SENTENCE.test(before) || ENDS_PAUSE.test(before)) return -4;
  if (!after.spaced) return -3;
  const next = bare(after.text);
  let cost = 7;
  if (OPENS_CLAUSE.has(next)) cost = 1;
  // "believes in him" — a preposition with just a pronoun after it stays with the word before.
  else if (OPENS_PHRASE.has(next)) cost = PRONOUNS.has(bare(units[index + 1]?.text ?? "")) ? 7 : 3;
  else if (STARTS_PREDICATE.has(next)) cost = 4;
  else if (next === "of") cost = 18;
  if (NEEDS_MORE.has(bare(before))) cost += 14;
  return cost;
}

function unitsOf(sentence: string): Unit[] {
  return sentence
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((word) =>
      word
        .split(/(?=—)/)
        .filter(Boolean)
        .map((text, index) => ({ text, spaced: index === 0 })),
    );
}

const join = (units: Unit[]) => units.map((unit, index) => (index > 0 && unit.spaced ? ` ${unit.text}` : unit.text)).join("");

// One sentence's lines, each about 4–6 words, broken where a reader would naturally pause.
export function naturalSenseLines(sentence: string): string[] {
  const units = unitsOf(sentence);
  if (units.length <= 3) return units.length ? [join(units)] : [];
  // best[end]: the lowest cost of dividing units[0, end); from[end]: where its last line starts.
  const best: number[] = [0];
  const from: number[] = [0];
  for (let end = 1; end <= units.length; end++) {
    best[end] = Infinity;
    for (let length = 1; length <= Math.min(MAX_LINE, end); length++) {
      const start = end - length;
      const cost = best[start] + LENGTH_COST[length] + (start > 0 ? breakCost(units, start) : 0);
      if (cost < best[end]) {
        best[end] = cost;
        from[end] = start;
      }
    }
  }
  const lines: string[] = [];
  for (let end = units.length; end > 0; end = from[end]) lines.unshift(join(units.slice(from[end], end)));
  return lines;
}
