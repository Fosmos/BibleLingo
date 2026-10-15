import type { TrailStop } from "@/lib/trailStops";

// A trail stop that reviews a passage already learned on it — the end of a pericope, or of a
// chapter — typed by first letter (InPlaceLessonSession.tsx's practice). `key` is what
// PathProgress.reviewsDone remembers it by.
export interface PassageReview {
  key: string;
  chapter: number;
  from: number;
  to: number;
}

// Up next once every lesson in `lessons` is done, then done once reviewed (`reviewsDone`).
export function passageReviewStop(key: string, label: string, title: string, lessons: TrailStop[], reviewsDone: string[]): TrailStop | null {
  const verses = lessons.flatMap((stop) => (stop.verse ? [stop.verse] : []));
  const first = verses[0];
  const last = verses[verses.length - 1];
  if (!first || !last) return null;
  const learned = lessons.every((stop) => stop.state === "done");
  return {
    key: `review-${key}`,
    dayNumber: lessons[lessons.length - 1].dayNumber,
    label,
    title,
    state: !learned ? "locked" : reviewsDone.includes(key) ? "done" : "current",
    checkpoint: true,
    dueIds: [],
    verses,
    review: { key, chapter: first.chapter, from: first.verseNumber, to: last.verseNumber },
  };
}

// The chapter a pericope or chapter section key ("p-8-12", "ch-8") is in.
export function chapterOfSectionKey(key: string | undefined): number | undefined {
  const match = key?.match(/^(?:p|ch)-(\d+)/);
  return match ? Number(match[1]) : undefined;
}
