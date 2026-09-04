import type { VerseSegment } from "@/types";
import type { PericopeInfo } from "@/lib/chapterPericopes";

export type RecallStep = { kind: "heading"; heading: PericopeInfo } | { kind: "verses"; verses: VerseSegment[] };

// Interleaves a multi-verse SRS entity's own verses with a gate for each pericope heading
// opened somewhere inside it — right before the verses that heading covers, not all bunched
// at the front, so a heading is reached (and typed) exactly where that section actually
// falls. `pericopeHeadings` is every heading opened within the entity's range (see
// lib/chapterPericopes.ts's getPericopeHeadingsInRange) — a heading covering the entity's own
// first verse from BEFORE the range starts is already excluded there, so it correctly never
// gets a gate here either.
export function buildRecallSteps(verses: VerseSegment[], pericopeHeadings: PericopeInfo[]): RecallStep[] {
  const headingByStartVerse = new Map(pericopeHeadings.map((heading) => [heading.startVerse, heading]));
  const steps: RecallStep[] = [];
  let currentSegment: VerseSegment[] = [];

  for (const verse of verses) {
    const heading = headingByStartVerse.get(verse.verseNumber);
    if (heading) {
      if (currentSegment.length > 0) {
        steps.push({ kind: "verses", verses: currentSegment });
        currentSegment = [];
      }
      steps.push({ kind: "heading", heading });
    }
    currentSegment.push(verse);
  }
  if (currentSegment.length > 0) steps.push({ kind: "verses", verses: currentSegment });

  return steps;
}
