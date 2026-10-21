import type { MemorizationDay, MemorizedEntity, PathKind, VerseSegment } from "@/types";
import { formatChapterLabel, formatVerseRangeLabel } from "@/lib/chapterContent";
import { getPericopeForVerse } from "@/lib/chapterPericopes";
import { entitiesInScope } from "@/lib/srsScopeStatus";
import { isDue } from "@/lib/srs";
import { chapterOfSectionKey, passageReviewStop, type PassageReview } from "@/lib/trailReviews";

// The Path tab's trail (design_handoff_path_trail): the path's own lesson days as stops, in
// sections — book and chapter paths by pericope, a topic path five at a time,
// a verse path as its one lesson's learning stages. One stop per verse — a day of several verses is
// several stops, each opening that day's lesson. Review days are the sections' trophy stops; a
// pericope is followed by a review section of the whole pericope, and a book's chapter by a chapter
// review section — each one stone on the map, opened straight from it (one stone for both when the
// pericope is the whole chapter).
// A chapter path's own closing review days are its last section.
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
  // The one verse a lesson stop is (each verse its own lesson); unset for review stops.
  verse?: VerseSegment;
  // A passage review stop — the pericope or chapter just learned (lib/trailReviews.ts).
  review?: PassageReview;
}

export interface TrailSection {
  // The section's reference, e.g. "Romans 8:1–11" ("Verses 1–5" for a topic, "Finish line").
  ref: string;
  kicker: string;
  title: string;
  stops: TrailStop[];
  state: "complete" | "current" | "locked";
  done: number;
  // A chapter review: one stop, opened straight from the map.
  review?: boolean;
  // What a review section reviews — a pericope, a chapter, or (the finish line) the whole path.
  reviewOf?: "pericope" | "chapter" | "final";
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

// `only`: one verse of the day, its `verseIndex`-th. Of the next day's verses, the first
// `versesIntoDay` are learned and the one after is up next — they unlock in order.
function stopFor(day: MemorizationDay, completedDays: number, nextDay: number | undefined, entities: MemorizedEntity[], now: Date, only?: VerseSegment, verseIndex = 0, versesIntoDay = 0): TrailStop {
  const verses = only ? [only] : day.kind === "learn" ? day.newVerses : day.reviewVerses;
  const inNext: StopState = !only || verseIndex === versesIntoDay ? "current" : verseIndex < versesIntoDay ? "done" : "locked";
  const state: StopState = day.dayNumber <= completedDays ? "done" : day.dayNumber === nextDay ? inNext : "locked";
  const first = verses[0];
  const last = verses[verses.length - 1];
  const dueIds =
    state === "done" && day.kind === "learn" && first && last
      ? entitiesInScope(entities, { book: first.book, chapter: first.chapter, startVerse: first.verseNumber, endVerse: last.chapter === first.chapter ? last.verseNumber : 999 })
          .filter((entity) => isDue(entity.srs, now))
          .map((entity) => entity.id)
      : [];
  return {
    key: only ? `day-${day.dayNumber}-${only.chapter}:${only.verseNumber}` : `day-${day.dayNumber}`,
    dayNumber: day.dayNumber,
    label: day.kind === "learn" ? shortRange(verses) : REVIEW_TITLES[day.kind],
    title: day.kind === "learn" ? formatVerseRangeLabel(verses) : REVIEW_TITLES[day.kind],
    state,
    checkpoint: day.kind !== "learn",
    dueIds,
    verses,
    verse: only,
  };
}

function finishSection(kicker: string, title: string, stops: TrailStop[], byPassage = false): TrailSection {
  if (stops.length) stops[stops.length - 1] = { ...stops[stops.length - 1], checkpoint: true };
  const done = stops.filter((stop) => stop.state === "done").length;
  const state = done === stops.length ? "complete" : stops.some((stop) => stop.state === "current") ? "current" : "locked";
  const verses = stops.flatMap((stop) => (stop.verse ? [stop.verse] : []));
  return { ref: byPassage && verses.length ? formatVerseRangeLabel(verses) : kicker, kicker, title, stops, state, done };
}

// Which section a stop belongs to — one verse of a lesson day, or a review day — by path kind: a
// label key plus its kicker and title.
function sectionOf(kind: PathKind, day: MemorizationDay, index: number, verse?: VerseSegment): { key: string; kicker: string; title: string } {
  const first = verse ?? (day.kind === "learn" ? day.newVerses : day.reviewVerses)[0];
  if (day.kind !== "learn" && day.chapterGroup === undefined && kind === "book") return { key: "final", kicker: "Finish line", title: "Final review" };
  if (day.kind !== "learn" && kind === "chapter") return { key: "final", kicker: "Finish line", title: "Chapter review" };
  if ((kind === "book" || kind === "chapter") && first) {
    const pericope = getPericopeForVerse(first.book, first.chapter, first.verseNumber);
    if (pericope) return { key: `p-${first.chapter}-${pericope.startVerse}`, kicker: `Verses ${pericope.startVerse}–${pericope.endVerse}`, title: pericope.heading };
    return { key: `ch-${first.chapter}`, kicker: `Chapter ${first.chapter}`, title: formatChapterLabel(first.book, first.chapter) };
  }
  const group = Math.floor(index / 5);
  return { key: `g-${group}`, kicker: `Verses ${group * 5 + 1}–${group * 5 + 5}`, title: `Part ${group + 1}` };
}

export function buildTrail(kind: PathKind, days: MemorizationDay[], completedDays: number, entities: MemorizedEntity[], stageLabels: string[], versesIntoDay = 0, reviewsDone: string[] = [], now: Date = new Date()): TrailSection[] {
  const nextDay = days.find((day) => day.dayNumber > completedDays)?.dayNumber;
  if (kind === "verse") {
    // One lesson, shown as its learning stages: all done once it's learned, else the first is up.
    const day = days.find((candidate) => candidate.kind === "learn");
    if (!day) return [];
    const base = stopFor(day, completedDays, nextDay, entities, now);
    const stops = stageLabels.map((label, index) => ({ ...base, key: `stage-${index}`, label, title: label, state: base.state === "current" && index > 0 ? ("locked" as const) : base.state, checkpoint: false }));
    return [{ ...finishSection("Stage 1 · Day 1", "Learn it", stops), ref: base.title }];
  }
  const groups: { key: string; kicker: string; title: string; stops: TrailStop[] }[] = [];
  const byPassage = kind === "book" || kind === "chapter";
  let current: (typeof groups)[number] | null = null;
  let learnIndex = 0;
  const entries = days.flatMap((day): { day: MemorizationDay; verse?: VerseSegment; index: number }[] => (day.kind === "learn" ? day.newVerses.map((verse, index) => ({ day, verse, index })) : [{ day, verse: undefined, index: 0 }]));
  for (const { day, verse, index } of entries) {
    const section = sectionOf(kind, day, kind === "topic" ? learnIndex : 0, verse);
    if (verse) learnIndex++;
    // Review days stay with the section before them (but a book's final review is its own).
    if (!current || (section.key !== current.key && (verse || section.key === "final"))) {
      current = { ...section, stops: [] };
      groups.push(current);
    }
    current.stops.push(verse ? stopFor(day, completedDays, nextDay, entities, now, verse, index, versesIntoDay) : stopFor(day, completedDays, nextDay, entities, now));
  }
  return groups.flatMap((group, index) => {
    const lessons = group.stops.filter((stop) => stop.verse);
    const review = group.key.startsWith("p-") ? passageReviewStop(`pericope:${group.key.slice(2)}`, "Review", `Review: ${group.title}`, lessons, reviewsDone) : null;
    const sections: TrailSection[] = [{ ...finishSection(group.kicker, group.title, group.stops, byPassage), reviewOf: group.key === "final" ? "final" : undefined }];
    // A book's chapter, once its last pericope is through, gets its own review section on the map.
    const chapter = chapterOfSectionKey(group.key);
    const endsChapter = kind === "book" && chapter !== undefined && chapterOfSectionKey(groups[index + 1]?.key) !== chapter;
    const chapterGroups = endsChapter ? groups.filter((other) => chapterOfSectionKey(other.key) === chapter) : [];
    // A pericope that is its chapter's only one shares the chapter's review stone — reviewed once,
    // done if either review was (one finished before they were combined counts).
    const sameAsChapter = review !== null && chapterGroups.length === 1;
    if (review && !sameAsChapter) sections.push({ ...finishSection("Pericope review", `Review: ${group.title}`, [review]), ref: sections[0].ref, review: true, reviewOf: "pericope" });
    if (endsChapter && chapter !== undefined) {
      const inChapter = chapterGroups.flatMap((other) => other.stops.filter((stop) => stop.verse));
      const book = inChapter[0]?.verse?.book ?? "";
      const done = sameAsChapter && review?.state === "done" ? [...reviewsDone, `chapter:${chapter}`] : reviewsDone;
      const title = sameAsChapter ? `Review ${formatChapterLabel(book, chapter)}: ${group.title}` : `Review ${formatChapterLabel(book, chapter)}`;
      const stop = passageReviewStop(`chapter:${chapter}`, "Review", title, inChapter, done);
      if (stop) sections.push({ ...finishSection("Chapter review", title, [stop]), ref: formatChapterLabel(book, chapter), review: true, reviewOf: "chapter" });
    }
    return sections;
  });
}
