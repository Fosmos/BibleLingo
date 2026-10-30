import { getCachedPericopes } from "@/lib/pericopeCache";

export interface PericopeTone {
  // A panel's fill, and the bar on the panel a pericope starts on.
  fill: string;
  bar: string;
}

// The pericope you're on, in orange — never one of the colours below.
const CURRENT: PericopeTone = { fill: "bg-brand-100 dark:bg-brand-900/40", bar: "border-l-brand-500" };
const TONES: PericopeTone[] = [
  { fill: "bg-sky-100 dark:bg-sky-900/40", bar: "border-l-sky-500" },
  { fill: "bg-violet-100 dark:bg-violet-900/40", bar: "border-l-violet-500" },
  { fill: "bg-teal-100 dark:bg-teal-900/40", bar: "border-l-teal-500" },
  { fill: "bg-rose-100 dark:bg-rose-900/40", bar: "border-l-rose-500" },
];

// Which of its chapter's pericopes a verse is in (0 before the first heading), so a pericope has the
// same colour in the storyboard and the lesson. `fallback` until the chapter's headings have loaded.
export function pericopeNumber(book: string, chapter: number, verseNumber: number, fallback = 0): number {
  const pericopes = getCachedPericopes(book, chapter);
  return pericopes ? pericopes.filter((pericope) => pericope.startVerse <= verseNumber).length : fallback;
}

export function pericopeTone(number: number, current: boolean): PericopeTone {
  return current ? CURRENT : TONES[number % TONES.length];
}
