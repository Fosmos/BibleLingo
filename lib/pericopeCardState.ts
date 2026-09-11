import type { MemorizationDay } from "@/types";
import type { PathZone } from "@/lib/pathZones";

export type PericopeCardStatus = "locked" | "active" | "completed";

export interface PericopeCardState {
  status: PericopeCardStatus;
  // The one day this card's button acts on. `actionKind` picks which of this app's two
  // lesson entry points it needs: "select" starts/continues a day for real
  // (progress-affecting), "practice" redoes an already-finished one (no side effects) —
  // same distinction DayCircle's own onSelect/onPractice already draw. Always set, even
  // when locked: every lesson stays reachable regardless of lock state, same principle
  // DayCircle's own onSelect always followed — locked only changes how the card looks, not
  // whether it can be opened, so a not-yet-reached lesson can still be previewed/tested.
  actionDay?: MemorizationDay;
  actionKind: "select" | "practice";
}

// A pericope zone's days are always contiguous in dayNumber (see lib/pathZones.ts), and a
// path's days unlock strictly in dayNumber order (see DayPathDiagram.tsx's isUnlocked
// pattern) — so a zone can only ever be entirely before, straddling, or entirely after
// `completedDays + 1`. This never needs to represent a zone as "partially done but not the
// currently active one," which is why one card only ever needs one action.
export function computeZoneCardState(zone: PathZone, completedDays: number): PericopeCardState {
  const activeDay = zone.days.find((day) => day.dayNumber === completedDays + 1);
  if (activeDay) {
    return { status: "active", actionDay: activeDay, actionKind: "select" };
  }

  const lastDay = zone.days[zone.days.length - 1];
  if (lastDay && lastDay.dayNumber <= completedDays) {
    // Redo the pericope's own last-learned verses, not whatever capstone day (a weekly
    // review, a boss battle) happens to trail it in this zone — that capstone already has
    // its own dedicated day elsewhere in the path.
    const learnDays = zone.days.filter((day) => day.kind === "learn");
    const reviewTarget = learnDays[learnDays.length - 1] ?? lastDay;
    return { status: "completed", actionDay: reviewTarget, actionKind: "practice" };
  }

  // Not reached yet — still previewable via its own first lesson, same as any other day.
  const firstLearnDay = zone.days.find((day) => day.kind === "learn");
  return { status: "locked", actionDay: firstLearnDay ?? zone.days[0], actionKind: "select" };
}

// True for every zone actually displaying today's active lesson's own verses — the home
// zone (which also owns the one "Learn" button for the whole lesson) and any earlier
// zone(s) that lesson merely spills through on its way there (see PathZone.spilloverVerses).
// Shared by PericopeCard.tsx (to decide what a card shows) and PathDayList.tsx (to decide
// which consecutive cards visually connect into one continuous box for that lesson).
export function zoneShowsTodaysVerses(zone: PathZone, state: PericopeCardState, completedDays: number): boolean {
  const isHome = state.status === "active" && state.actionDay?.kind === "learn";
  const hasActiveSpillover = zone.spilloverVerses?.some((entry) => entry.dayNumber === completedDays + 1) ?? false;
  return isHome || hasActiveSpillover;
}
