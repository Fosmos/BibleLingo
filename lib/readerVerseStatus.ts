import type { MemorizedEntity } from "@/types";
import { formatNextReview, isDue } from "@/lib/srs";

// A verse's state in the Path tab's chapter reader: rooted (known), growing, due, current (the
// path's next verse) or open (not started) — lib/verseMemoryState.ts plus the path's next verse.
export type VerseStatus = "rooted" | "growing" | "due" | "current" | "open";

// The reader's one action per verse (design_handoff_bible_progress → Action bar).
export const ACTION_WORD: Record<VerseStatus, string> = { due: "Review", rooted: "Practise", growing: "Practise", current: "Learn", open: "Learn" };

export const STATUS_LABEL: Record<VerseStatus, string> = { rooted: "Known", due: "Due", growing: "Growing", current: "", open: "Not started" };

const DAY_MS = 24 * 60 * 60 * 1000;

// The note beside a verse's status: "3 days overdue", "next review in 5 days", "new to you".
export function statusNote(status: VerseStatus, covering: MemorizedEntity[], now: Date = new Date()): string {
  if (status === "open") return "new to you";
  if (status === "current") return "";
  const entity = covering.find((candidate) => isDue(candidate.srs, now)) ?? covering[0];
  if (!entity) return "not in review yet";
  if (status === "due") {
    const late = entity.srs.nextDueAt ? Math.floor((now.getTime() - new Date(entity.srs.nextDueAt).getTime()) / DAY_MS) : 0;
    return late <= 0 ? "due today" : late === 1 ? "1 day overdue" : `${late} days overdue`;
  }
  return formatNextReview(entity.srs.nextDueAt, now).toLowerCase();
}
