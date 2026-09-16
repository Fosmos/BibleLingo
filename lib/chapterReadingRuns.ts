import type { VerseSegment } from "@/types";

export interface DayRun {
  // undefined for a verse whose owning day isn't a "learn" day at all — never actually
  // happens here (every verse in a chapter/book path's flat verse list belongs to exactly
  // one learn day's newVerses), kept optional only so a caller can't assume a run is always
  // resolvable without checking.
  dayNumber?: number;
  verses: VerseSegment[];
}

// Splits a pericope segment's own verses (see lib/pathZones.ts's versesByPericopeSegment)
// into consecutive runs sharing the same owning lesson day — e.g. a 5-verse pericope taught
// across two lessons becomes two runs. Each run renders as one tappable span in
// ChapterReadingView.tsx (open/preview/review whichever lesson taught it), rather than every
// individual verse being its own fiddly tap target.
export function buildDayRuns(verses: VerseSegment[], dayNumberByVerse: Map<number, number>): DayRun[] {
  const runs: DayRun[] = [];
  for (const verse of verses) {
    const dayNumber = dayNumberByVerse.get(verse.verseNumber);
    const last = runs[runs.length - 1];
    if (last && last.dayNumber === dayNumber) {
      last.verses.push(verse);
    } else {
      runs.push({ dayNumber, verses: [verse] });
    }
  }
  return runs;
}

export type RunState = "completed" | "today" | "future";

// A run's own display state — every verse in a run shares one owning day, so this is
// necessarily uniform across the whole run, never per-verse. Every state renders inline in
// the same flowing paragraph (see ChapterVerseRun.tsx) — "today" gets its own inline
// highlight and number color, never a separate boxed-out block, so a verse's own position on
// the page never shifts depending on which state it happens to be in today. Completion is
// checked BEFORE today-ness: today's own lesson still reads as "today" (gold) while it's
// still to do, but the moment it's actually finished — completedDays bumps immediately on
// completion, same real calendar day or not (see lib/dayRollover.ts) — it flips straight to
// "completed" (green) rather than staying gold until a calendar day boundary passes.
export function runState(run: DayRun, completedDays: number, todaysVerseNumbers: Set<number>): RunState {
  if (run.dayNumber === undefined) return "future";
  if (run.dayNumber <= completedDays) return "completed";
  if (todaysVerseNumbers.has(run.verses[0].verseNumber)) return "today";
  return "future";
}
