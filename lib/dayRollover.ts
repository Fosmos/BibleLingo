import type { PathProgress } from "@/types";

// Calendar-day equality (not a raw 24h/ms diff) — same definition lib/streak.ts's own
// daysSinceLastCompletion uses, so "did today's lesson already happen" and "has a streak day
// been missed" never quietly disagree with each other over the same clock.
function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// True once this path's most recent lesson finished on this same real calendar date — the one
// fact every "what's active today" computation below is gated on. Completing a lesson bumps
// completedDays (real, permanent progress) immediately, but it should NOT immediately reveal
// the next day's verses as "today's lesson" too — that only happens once an actual midnight
// passes, not the instant a lesson ends (see PathProgress.lastCompletedAt's own doc comment).
export function hasCompletedToday(plan: PathProgress, now: Date): boolean {
  return plan.lastCompletedAt ? isSameCalendarDay(new Date(plan.lastCompletedAt), now) : false;
}

// The dayNumber every "what's next to work on today" computation across this app means by
// completedDays + 1 — except once today's own lesson is already done, when it becomes -1: a
// sentinel that can never match a real MemorizationDay (dayNumber always starts at 1), so
// every zone/day falls through to its ordinary completed/locked read instead of ever showing
// as freshly "active" again before a real calendar day boundary passes. Every OTHER progress
// check (has day N already been finished, can it be replayed) keeps reading
// plan.completedDays directly, completely unaffected — only "what's the next NEW thing to
// reveal" is gated by this.
export function activeDayNumber(plan: PathProgress, now: Date): number {
  return hasCompletedToday(plan, now) ? -1 : plan.completedDays + 1;
}

// "Which day counts as TODAY's own lesson" — always a real dayNumber, whether that lesson is
// still to come, in progress, or already finished. Unlike activeDayNumber above (which goes
// to -1 once today's lesson is done, so nothing NEW gets offered), this never hides what was
// already accomplished today — it's for every "still show today's own thing" display: the
// Mind Map's amber ring on a just-finished pericope/chapter, the parchment view's gold
// highlight on today's verses, Home's Today's Verses card content. Use activeDayNumber for
// gating what's offerable to START; use this for everything that should keep reading as
// "today" regardless of whether today's lesson happened yet.
export function todaysDayNumber(plan: PathProgress, now: Date): number {
  return hasCompletedToday(plan, now) ? plan.completedDays : plan.completedDays + 1;
}
