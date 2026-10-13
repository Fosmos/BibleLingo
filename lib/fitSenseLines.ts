// Sense lines for the path view that each fit one line of the column: a verse's clauses (from
// parseToSenseLines) are packed onto a line while they fit, a new sentence always starts a new
// line, and a clause too long for one line is split into as few, evenly balanced pieces as fit.
const ENDS_SENTENCE = /[.?!]["'”’)]*$/;

// Words packed greedily into lines no wider than `limit`.
function pack(words: string[], measure: (text: string) => number, limit: number): string[] {
  const lines: string[] = [];
  for (const word of words) {
    const last = lines[lines.length - 1];
    if (last !== undefined && measure(`${last} ${word}`) <= limit) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
}

// As few lines as fit `width`, then evened out: the narrowest limit that still needs no more lines.
function splitClause(clause: string, measure: (text: string) => number, width: number): string[] {
  const words = clause.split(" ");
  const count = pack(words, measure, width).length;
  let low = 0;
  let high = width;
  while (high - low > 2) {
    const mid = (low + high) / 2;
    if (pack(words, measure, mid).length <= count) high = mid;
    else low = mid;
  }
  return pack(words, measure, high);
}

// `measure` gives a string's rendered width in px; `width` is the column's (0 = not measured yet,
// so every clause stands as its own line).
export function fitSenseLines(clauses: string[], measure: (text: string) => number, width: number): string[] {
  if (!width) return clauses;
  const fits = (text: string) => measure(text) <= width;
  const lines: string[] = [];
  let current = "";
  const flush = () => {
    if (current) lines.push(current);
    current = "";
  };
  for (const clause of clauses) {
    const joined = current ? `${current} ${clause}` : clause;
    if (fits(joined)) current = joined;
    else {
      flush();
      if (fits(clause)) current = clause;
      else lines.push(...splitClause(clause, measure, width));
    }
    if (ENDS_SENTENCE.test(current)) flush();
  }
  flush();
  return lines;
}
