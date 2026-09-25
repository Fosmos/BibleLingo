import type { MindMapPericopeDatum } from "@/lib/mindMapHierarchy";
import { isVerseLearned } from "@/lib/pericopeLearned";
import { hallGeometry, type HallChip } from "@/lib/mindMapHallGeometry";

// A pericope's own unrolled verse chain (see MindMapVerseStream.tsx) — the pure geometry shared
// between that component's own rendering and lib/mindMapTreeLayout.ts's own accordion push-down
// math, so both always agree on exactly how much room a given pericope's own verses really need.
// Split into its own file (rather than living in either of those two) purely so neither one has
// to import the other just for these few constants/helpers.
//
// Strung directly below the expanded pericope's own card, continuing the SAME winding spine
// down to wherever the next pericope card ends up (see lib/mindMapTreeLayout.ts's own
// placePericopes) — a small alternating left/right wander around the pericope's own x, much
// narrower than a real pericope's own side-to-side reach (PERICOPE_SIDE_OFFSET_PX), so the chain
// reads as a THIN continuation of the trail through this one room, not a fork off of it.

export const VERSE_CHIP_SIZE_PX = 24;

// A hall's heading wraps onto more lines once it's longer than its card allows (see
// MindMapPericopeGateway.tsx's HALL_TITLE_MAX_WIDTH_CLASS) — estimated here, word by word, at a
// conservative ~7px per character of its 13px serif, so the layout makes room for every extra
// line without measuring the DOM. Erring on the side of more lines only adds a little air.
const HALL_TITLE_CHARS_PER_LINE = 20;
const HALL_TITLE_LINE_PX = 18;

export function hallTitleLines(label: string): number {
  let lines = 1;
  let length = 0;
  for (const word of label.split(/\s+/).filter(Boolean)) {
    const next = length === 0 ? word.length : length + 1 + word.length;
    if (length > 0 && next > HALL_TITLE_CHARS_PER_LINE) {
      lines += 1;
      length = word.length;
    } else {
      length = next;
    }
  }
  return lines;
}

// How much taller than a one-line hall this hall's card is — half of it reaches up toward the
// previous hall, half down toward its own first verse, and the layout clears both.
export function hallExtraHeightPx(pericope: MindMapPericopeDatum): number {
  return (hallTitleLines(pericope.label) - 1) * HALL_TITLE_LINE_PX;
}

// Every real verse number this pericope's own structural range covers, in order — empty while
// that range hasn't loaded yet (see MindMapPericopeDatum.rangeStartVerse's own doc comment).
export function verseStreamNumbers(pericope: MindMapPericopeDatum): number[] {
  const { rangeStartVerse, rangeEndVerse } = pericope;
  if (rangeStartVerse === undefined || rangeEndVerse === undefined || rangeEndVerse < rangeStartVerse) return [];
  const numbers: number[] = [];
  for (let verse = rangeStartVerse; verse <= rangeEndVerse; verse++) numbers.push(verse);
  return numbers;
}

// Each verse chip's own point and size, relative to the pericope card's own center (0, 0) — the
// hall's own structure-shaped sweep (see lib/mindMapHallGeometry.ts). Same order as `verseNumbers`.
export function verseStreamPoints(pericope: MindMapPericopeDatum, verseNumbers: number[], hallNumber: number | undefined): HallChip[] {
  return hallGeometry(pericope, verseNumbers, hallNumber, hallExtraHeightPx(pericope)).chips;
}

// How much vertical room this pericope's own unrolled verses need — the exact amount
// lib/mindMapPericopeSpine.ts's placePericopes pushes every LATER hall down by. A formula of the
// verse text, never a DOM measurement.
export function verseStreamHeightPx(pericope: MindMapPericopeDatum, hallNumber: number | undefined): number {
  return hallGeometry(pericope, verseStreamNumbers(pericope), hallNumber, hallExtraHeightPx(pericope)).heightPx;
}

// The verse today's lesson picks up at — this pericope's first verse not yet memorized — which
// the Mind Map marks with its bobbing "you are here" pin (see MindMapActivePin.tsx). Undefined
// once every verse in it is memorized.
export function nextVerseToLearn(pericope: MindMapPericopeDatum): number | undefined {
  return verseStreamNumbers(pericope).find((verseNumber) => !isVerseLearned(pericope, verseNumber));
}

type PinTarget = { book?: string; chapter: number; verseNumber: number };

// The one verse on the whole canvas that carries the "you are here" pin (MindMapActivePin.tsx):
// the verse being drilled while a lesson is open in the sheet (`focusVerse`), otherwise the next
// verse today's lesson picks up at — in the FIRST active hall, since one lesson can span several.
//
// Once today's lesson is done, `nextVerse` (see nextPathVerse) takes over: the pin moves on to the
// next verse still to be memorized on the path, while today's verses keep their own pulse.
export function mapPinTarget(
  pericopes: MindMapPericopeDatum[],
  focusVerse: PinTarget | undefined,
  todayVerseKeys?: Set<string>,
  nextVerse?: PinTarget,
): PinTarget | undefined {
  if (focusVerse) return focusVerse;
  if (nextVerse) return nextVerse;
  for (const pericope of pericopes) {
    if (pericope.status !== "active") continue;
    // Only a verse today's lesson actually covers — a hall can hold verses outside this path (a
    // single-verse path's hall still spans its whole section).
    const verseNumber = verseStreamNumbers(pericope).find(
      (verse) =>
        !isVerseLearned(pericope, verse) &&
        (!todayVerseKeys || todayVerseKeys.size === 0 || todayVerseKeys.has(`${pericope.book}:${pericope.chapter}:${verse}`)),
    );
    if (verseNumber !== undefined) return { book: pericope.book, chapter: pericope.chapter, verseNumber };
  }
  // No hall of today's lesson laid out (its chapter isn't open) — the first verse of today's lesson.
  const first = [...(todayVerseKeys ?? [])]
    .map((key) => key.split(":"))
    .map(([book, chapter, verse]) => ({ book, chapter: Number(chapter), verseNumber: Number(verse) }))
    .sort((a, b) => a.chapter - b.chapter || a.verseNumber - b.verseNumber)[0];
  return first;
}

// While the pinned verse isn't on screen (its chapter closed), the node the pin moves to instead:
// the closest one that is — its chapter, else its book, its genre, its testament, the root. Undefined
// when the verse itself is showing (its chip carries the pin).
export function pinnedRingId(
  target: PinTarget | undefined,
  layout: { nodes: { data: { id: string } }[]; verseChips: { pericopeId: string; verseNumber: number }[] },
  parentMap: Map<string, string>,
): string | undefined {
  if (!target?.book) return undefined;
  const chipShown = layout.verseChips.some((chip) => chip.verseNumber === target.verseNumber && chip.pericopeId.startsWith(`pericope:${target.book}:${target.chapter}:`));
  if (chipShown) return undefined;
  const shown = new Set(layout.nodes.map((node) => node.data.id));
  let id: string | undefined = parentMap.has(`chapter:${target.book}:${target.chapter}`) ? `chapter:${target.book}:${target.chapter}` : `book:${target.book}`;
  while (id && !shown.has(id)) id = parentMap.get(id);
  return id ?? "root";
}

// This pericope's chip number matching the canvas-wide pin target above, if the target is in its
// own chapter (a chip only renders the pin when its own number matches).
export function pinVerseNumber(pericope: MindMapPericopeDatum, target: PinTarget | undefined): number | undefined {
  if (!target) return undefined;
  const sameChapter = target.chapter === pericope.chapter && (!target.book || target.book === pericope.book);
  return sameChapter ? target.verseNumber : undefined;
}

// Today's lesson verses, as `${book}:${chapter}:${verse}` keys — the Mind Map's plain overview
// pulses their chips outward (see MindMapVerseStream.tsx). Empty while a lesson or review is open
// in the sheet (`focusVerse` set): there the pin alone marks the verse being drilled.
export function todaysLessonVerseKeys(
  bookLabel: string,
  chapters: { days: { dayNumber: number; newVerses: { chapter: number; verseNumber: number }[] }[] }[],
  todaysDay: number,
  focusVerse: PinTarget | undefined,
): Set<string> {
  if (focusVerse) return new Set();
  const today = chapters.flatMap((chapter) => chapter.days).filter((day) => day.dayNumber === todaysDay);
  return new Set(today.flatMap((day) => day.newVerses.map((verse) => `${bookLabel}:${verse.chapter}:${verse.verseNumber}`)));
}

// The first verse of the path's next lesson still to come — where the pin waits once today's
// lesson is complete. Undefined when every lesson is done.
export function nextPathVerse(
  bookLabel: string,
  chapters: { days: { dayNumber: number; kind: string; newVerses: { chapter: number; verseNumber: number }[] }[] }[],
  completedDays: number,
): PinTarget | undefined {
  const next = chapters
    .flatMap((chapter) => chapter.days)
    .filter((day) => day.kind === "learn" && day.dayNumber > completedDays && day.newVerses.length > 0)
    .sort((a, b) => a.dayNumber - b.dayNumber)[0];
  const verse = next?.newVerses[0];
  return verse ? { book: bookLabel, chapter: verse.chapter, verseNumber: verse.verseNumber } : undefined;
}
