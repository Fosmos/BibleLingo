import type { MemorizationDay, MemorizedEntity, PathKind, VerseSegment } from "@/types";
import { formatChapterLabel, formatVerseRangeLabel } from "@/lib/chapterContent";
import { getPericopeForVerse } from "@/lib/chapterPericopes";
import { entitiesInScope } from "@/lib/srsScopeStatus";
import { isDue } from "@/lib/srs";

// The Path tab's winding trail (design_handoff_path_picker): the path's own lesson days as stops,
// in sections — a book path by chapter, a chapter path by pericope, a topic path five at a time,
// a verse path as its one lesson's learning stages. Review days are the sections' trophy stops.
export type StopState = "done" | "current" | "locked";

export interface TrailStop {
  key: string;
  dayNumber: number;
  label: string;
  title: string;
  state: StopState;
  checkpoint: boolean;
  // Spaced-review ranges in this stop's verses that are due now.
  dueIds: string[];
  verses: VerseSegment[];
}

export interface TrailSection {
  kicker: string;
  title: string;
  stops: TrailStop[];
  state: "complete" | "current" | "locked";
  done: number;
}

const REVIEW_TITLES: Record<Exclude<MemorizationDay["kind"], "learn">, string> = {
  weekly_review: "Weekly review",
  section_boss_battle: "Boss battle",
  monthly_review: "Monthly review",
  chapter_review: "Full review",
  boss_battle: "Final boss battle",
};

function shortRange(verses: VerseSegment[]): string {
  const first = verses[0];
  const last = verses[verses.length - 1];
  if (!first || !last) return "";
  if (first.chapter !== last.chapter) return `${first.chapter}:${first.verseNumber}–${last.chapter}:${last.verseNumber}`;
  return first.verseNumber === last.verseNumber ? `${first.chapter}:${first.verseNumber}` : `${first.chapter}:${first.verseNumber}–${last.verseNumber}`;
}

function stopFor(day: MemorizationDay, completedDays: number, nextDay: number | undefined, entities: MemorizedEntity[], now: Date): TrailStop {
  const verses = day.kind === "learn" ? day.newVerses : day.reviewVerses;
  const state: StopState = day.dayNumber <= completedDays ? "done" : day.dayNumber === nextDay ? "current" : "locked";
  const first = verses[0];
  const last = verses[verses.length - 1];
  const dueIds =
    state === "done" && day.kind === "learn" && first && last
      ? entitiesInScope(entities, { book: first.book, chapter: first.chapter, startVerse: first.verseNumber, endVerse: last.chapter === first.chapter ? last.verseNumber : 999 })
          .filter((entity) => isDue(entity.srs, now))
          .map((entity) => entity.id)
      : [];
  return {
    key: `day-${day.dayNumber}`,
    dayNumber: day.dayNumber,
    label: day.kind === "learn" ? shortRange(verses) : REVIEW_TITLES[day.kind],
    title: day.kind === "learn" ? formatVerseRangeLabel(verses) : REVIEW_TITLES[day.kind],
    state,
    checkpoint: day.kind !== "learn",
    dueIds,
    verses,
  };
}

function finishSection(kicker: string, title: string, stops: TrailStop[]): TrailSection {
  if (stops.length) stops[stops.length - 1] = { ...stops[stops.length - 1], checkpoint: true };
  const done = stops.filter((stop) => stop.state === "done").length;
  const state = done === stops.length ? "complete" : stops.some((stop) => stop.state === "current") ? "current" : "locked";
  return { kicker, title, stops, state, done };
}

// Which section a day belongs to, by path kind — a label key plus its kicker and title.
function sectionOf(kind: PathKind, day: MemorizationDay, index: number): { key: string; kicker: string; title: string } {
  const first = (day.kind === "learn" ? day.newVerses : day.reviewVerses)[0];
  if (day.kind !== "learn" && day.chapterGroup === undefined && kind === "book") return { key: "final", kicker: "Finish line", title: "Final review" };
  if (kind === "book") {
    const chapter = day.chapterGroup ?? first?.chapter ?? 1;
    return { key: `ch-${chapter}`, kicker: `Chapter ${chapter}`, title: first ? formatChapterLabel(first.book, chapter) : `Chapter ${chapter}` };
  }
  if (kind === "chapter" && first) {
    const pericope = getPericopeForVerse(first.book, first.chapter, first.verseNumber);
    if (pericope) return { key: `p-${pericope.startVerse}`, kicker: `Verses ${pericope.startVerse}–${pericope.endVerse}`, title: pericope.heading };
    return { key: "all", kicker: formatChapterLabel(first.book, first.chapter), title: "The whole chapter" };
  }
  const group = Math.floor(index / 5);
  return { key: `g-${group}`, kicker: `Verses ${group * 5 + 1}–${group * 5 + 5}`, title: `Part ${group + 1}` };
}

export function buildTrail(kind: PathKind, days: MemorizationDay[], completedDays: number, entities: MemorizedEntity[], stageLabels: string[], now: Date = new Date()): TrailSection[] {
  const nextDay = days.find((day) => day.dayNumber > completedDays)?.dayNumber;
  if (kind === "verse") {
    // One lesson, shown as its learning stages: all done once it's learned, else the first is up.
    const day = days.find((candidate) => candidate.kind === "learn");
    if (!day) return [];
    const base = stopFor(day, completedDays, nextDay, entities, now);
    const stops = stageLabels.map((label, index) => ({ ...base, key: `stage-${index}`, label, title: label, state: base.state === "current" && index > 0 ? ("locked" as const) : base.state, checkpoint: false }));
    return [finishSection("Stage 1 · Day 1", "Learn it", stops)];
  }
  const sections: TrailSection[] = [];
  let current: { key: string; kicker: string; title: string; stops: TrailStop[] } | null = null;
  let learnIndex = 0;
  for (const day of days) {
    const section = sectionOf(kind, day, kind === "topic" ? learnIndex : 0);
    if (day.kind === "learn") learnIndex++;
    if (!current || (section.key !== current.key && !(day.kind !== "learn" && kind !== "book"))) {
      if (current) sections.push(finishSection(current.kicker, current.title, current.stops));
      current = { ...section, stops: [] };
    }
    current.stops.push(stopFor(day, completedDays, nextDay, entities, now));
  }
  if (current) sections.push(finishSection(current.kicker, current.title, current.stops));
  return sections;
}
