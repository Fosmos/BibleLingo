import { parseToSenseLines } from "@/lib/senseLines";
import { buildDrawTokens } from "@/lib/verseDrawTokens";

// How a sense line shows on a step of the say-it ladder: the words, each word's first letter, or
// nothing (one empty bar).
export type LineMode = "full" | "letters" | "blank";

// The say-it ladder for a verse of `lineCount` sense lines (the default Learn lesson —
// lib/learnSteps.ts): read the verse aloud; then say it with the first line as first letters, then
// the first two, until every line is first letters; then with the first line blank, then the first
// two, until every line is blank. Each entry is one step's mode for each line.
export function sayLadder(lineCount: number): LineMode[][] {
  const rungs: LineMode[][] = [Array.from({ length: lineCount }, () => "full")];
  for (let letters = 1; letters <= lineCount; letters++) rungs.push(Array.from({ length: lineCount }, (_, line) => (line < letters ? "letters" : "full")));
  for (let blanks = 1; blanks <= lineCount; blanks++) rungs.push(Array.from({ length: lineCount }, (_, line) => (line < blanks ? "blank" : "letters")));
  return rungs;
}

// What a step asks, for its label.
export function ladderLabel(modes: LineMode[]): string {
  if (modes.every((mode) => mode === "full")) return "Read it aloud";
  if (modes.every((mode) => mode === "blank")) return "Say it from memory";
  return modes.includes("blank") ? "Say it with lines hidden" : "Say it with first letters";
}

// Each of the verse's words' mode, in the word order the speech reveal counts in
// (lib/useSpeakRepReveal.ts — buildDrawTokens' words, references left out).
export function ladderWordModes(text: string, modes: LineMode[]): LineMode[] {
  return parseToSenseLines(text).flatMap((line, index) => {
    const words = buildDrawTokens(line, {}).filter((token) => token.kind === "word" && !token.isReference).length;
    return Array.from({ length: words }, () => modes[index] ?? modes[modes.length - 1] ?? "full");
  });
}
