import type { MemorizedEntity } from "@/types";

const DAY = (at: string) => new Date(at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const SHORT = (at: string) => new Date(at).toLocaleDateString(undefined, { month: "short", day: "numeric" });

// When a passage was memorized, for its stats page: the day, or the days it was memorized over
// ("Oct 3 – Oct 15, 2026") when it grew a verse at a time. A range saved before dates were kept
// shows when it was first reviewed instead ("by Oct 3, 2026"), or nothing known.
export function memorizedDateText(entity: MemorizedEntity): string {
  const { memorizedAt, lastAddedAt } = entity;
  if (memorizedAt) return lastAddedAt && DAY(lastAddedAt) !== DAY(memorizedAt) ? `${SHORT(memorizedAt)} – ${DAY(lastAddedAt)}` : DAY(memorizedAt);
  const firstReview = entity.srs.history?.[0]?.at ?? entity.srs.lastReviewedAt;
  return firstReview ? `by ${DAY(firstReview)}` : "before dates were kept";
}

// The earliest a set of passages is known to have been memorized — a book's first memorized day
// (a range from before dates were kept counting from its first review).
export function firstMemorizedText(entities: MemorizedEntity[]): string | null {
  const first = entities.flatMap((entity) => entity.memorizedAt ?? entity.srs.history?.[0]?.at ?? entity.srs.lastReviewedAt ?? []).sort()[0];
  return first ? DAY(first) : null;
}
