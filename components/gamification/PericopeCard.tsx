"use client";

import type { ReactNode, Ref } from "react";
import { motion } from "framer-motion";
import { versesByPericopeSegment, type PathZone } from "@/lib/pathZones";
import type { PericopeCardState } from "@/lib/pericopeCardState";
import { dayLabel } from "@/components/gamification/DayCircle";
import { formatVerseRangeLabel } from "@/lib/chapterContent";
import { MOTION_DURATION } from "@/lib/motionTokens";
import { PericopeCardRail } from "@/components/gamification/PericopeCardRail";
import { PericopeVerseGrid } from "@/components/gamification/PericopeVerseGrid";
import { PericopeCardAction } from "@/components/gamification/PericopeCardAction";

interface PericopeCardProps {
  zone: PathZone;
  state: PericopeCardState;
  index: number;
  isLast: boolean;
  completedDays: number;
  // Whether the card immediately before/after this one in the list is also part of today's
  // one active lesson (see lib/pericopeCardState.ts's zoneShowsTodaysVerses) — when either
  // is true, this card visually merges into that neighbor instead of reading as its own
  // separate box, since together they're really just one lesson's verses split across
  // sections. Only ever true while a lesson is actually spanning multiple pericopes.
  connectToPrevious: boolean;
  connectToNext: boolean;
  // Set only on the currently-active card — see PathDayList.tsx, which scrolls to whichever
  // card holds this ref the moment the path view opens.
  cardRef?: Ref<HTMLDivElement>;
  onSelectDay: (dayNumber: number) => void;
  onPracticeDay: (dayNumber: number) => void;
  // Building view only (see BuildingRoomView.tsx) — this section's own pericope-level
  // location/peg tags, rendered right under the heading; and this section's per-verse tags,
  // rendered right under the verse grid (only while that grid itself is showing, same as
  // every other showsTodaysVerses-gated part of this card). Undefined outside Building view.
  headerExtra?: ReactNode;
  verseGridExtra?: ReactNode;
}

// One pericope's own row: a rail circle straddling its card's own top-left corner (checked
// once done, glowing on every card actually showing today's verses — the home section AND
// any earlier spillover-only section a lesson merely passes through, see showsTodaysVerses
// below — locked-outline otherwise), a thick dotted line running the full row height behind
// it to connect to its neighbors, and the card itself —
// verse-reference/heading header, then, on whichever card(s) actually show today's verses, a
// 5-column grid of every verse in that section (see PericopeVerseGrid.tsx), then the card's
// one action (see PericopeCardAction.tsx): the active card's own "Today's Verse(s)" preview +
// "Learn" button, or, for every other card, a single button that replays a finished pericope,
// previews a not-yet-reached one, or opens whatever capstone day (Weekly Review, Boss
// Battle, ...) is active here instead — see lib/pericopeCardState.ts. Locked only changes how
// the button looks, not whether it works: every pericope stays reachable regardless of lock
// state. Every card actually showing today's verses (the home section, and any earlier
// section a lesson merely spills through — see lib/pathZones.ts) stays at full strength;
// every other one fades back. A spillover-only card (part of today's lesson, but not its
// home) drops its own action and merges visually into its connected neighbor instead.
export function PericopeCard({
  zone,
  state,
  index,
  isLast,
  completedDays,
  connectToPrevious,
  connectToNext,
  cardRef,
  onSelectDay,
  onPracticeDay,
  headerExtra,
  verseGridExtra,
}: PericopeCardProps) {
  const { status, actionDay, actionKind } = state;
  const isActive = status === "active";
  const isCompleted = status === "completed";
  // The one case with an actual "today" to name — every other button (Review, a capstone
  // day's own name, or a not-yet-reached lesson's "Locked" preview) is a plain single-line
  // label.
  const isTodaysLesson = isActive && actionDay?.kind === "learn";
  // This zone's own slice of today's lesson — the whole lesson always starts from here (see
  // handleClick below), but a lesson that crosses a section break only shows the verses that
  // actually belong to THIS section; the rest show as "Today's Verse(s)" too, back in
  // whichever earlier section(s) they're really part of (see zone.spilloverVerses, and
  // lib/pathZones.ts's buildPathZones for why the button itself is always the LATTER
  // section).
  const todaysVerses = isTodaysLesson && actionDay ? (versesByPericopeSegment(actionDay.newVerses)?.at(-1)?.verses ?? actionDay.newVerses) : [];
  // Only ever shows for the lesson that's actually active right now — a day that's since
  // finished or hasn't come up yet contributes no spillover here, same as its own home zone
  // dropping its verse text once it's no longer the active lesson either.
  const activeSpillover = zone.spilloverVerses?.find((entry) => entry.dayNumber === completedDays + 1)?.verses;
  const hasActiveSpillover = (activeSpillover?.length ?? 0) > 0;
  // Drives the card's own highlight — every box actually showing today's verses stays at
  // full strength, not just the one that happens to hold the "Learn" button. A section that
  // ONLY has spillover verses can otherwise be a "locked" zone in its own right (no home
  // lesson has ever landed there yet — see lib/pathZones.ts), which would fade it despite it
  // genuinely being part of today's lesson.
  const showsTodaysVerses = isTodaysLesson || hasActiveSpillover;
  // This card is purely a continuation of today's lesson into an earlier section — its own
  // independent action (Review, Locked, ...) would be redundant/confusing right above the
  // section that actually has the "Learn" button, so it drops the button entirely. Same
  // treatment for a pericope so short it never gets a home day of its own at all (see
  // lib/pericopeCardState.ts) — there's no single lesson of its own left to replay once it's
  // done, only ever a later one that reaches beyond it.
  const isSpilloverOnly = (hasActiveSpillover && !isTodaysLesson) || (status === "completed" && !actionDay);
  // Whichever of today's verses actually belong to THIS card's own section — drives the
  // per-verse grid below. A card is never both the home and a spillover card for the same
  // lesson at once (see lib/pathZones.ts), so exactly one of these is ever non-empty.
  const highlightedVerseNumbers = new Set((isTodaysLesson ? todaysVerses : (activeSpillover ?? [])).map((verse) => verse.verseNumber));
  // Every verse in this section already taught by a FINISHED day — its own home day(s) here
  // (zone.days always holds every learn day whose home landed in this exact pericope, not
  // just the active one — a short pericope under 1-verse-a-day can rack up several) plus any
  // now-completed lesson that once spilled through here on its way to a later section (a
  // spillover entry stops showing once its day is no longer active — see activeSpillover
  // above — so this checks every entry's own dayNumber directly instead of reusing that).
  // Never overlaps highlightedVerseNumbers by construction: a day only lands here once its
  // dayNumber is <= completedDays, while today's active lesson is always completedDays + 1.
  const completedVerseNumbers = new Set<number>();
  for (const homeDay of zone.days) {
    if (homeDay.dayNumber <= completedDays) {
      for (const verse of homeDay.newVerses) completedVerseNumbers.add(verse.verseNumber);
    }
  }
  for (const entry of zone.spilloverVerses ?? []) {
    if (entry.dayNumber <= completedDays) {
      for (const verse of entry.verses) completedVerseNumbers.add(verse.verseNumber);
    }
  }

  const actionLabel = !actionDay ? "" : actionKind === "practice" ? "Review" : actionDay.kind !== "learn" ? dayLabel(actionDay) : "";

  function handleClick() {
    if (!actionDay) return;
    if (actionKind === "practice") onPracticeDay(actionDay.dayNumber);
    else onSelectDay(actionDay.dayNumber);
  }

  return (
    <div className={`flex w-full gap-0 ${connectToNext ? "pb-0" : "pb-4"}`}>
      <PericopeCardRail isLast={isLast} isCompleted={isCompleted} showsTodaysVerses={showsTodaysVerses} />

      <motion.div
        ref={cardRef}
        initial={{ y: 8 }}
        animate={{ y: 0 }}
        transition={{ delay: index * 0.05, duration: MOTION_DURATION.base }}
        className={`-ml-7 w-full border p-4 pl-11 transition-opacity duration-300 ${connectToPrevious ? "rounded-t-none border-t-0" : "rounded-t-2xl"} ${
          connectToNext ? "rounded-b-none border-b-0" : "rounded-b-2xl"
        } ${showsTodaysVerses ? "opacity-100" : "opacity-55"} ${
          showsTodaysVerses
            ? "border-brand-500 bg-white shadow-[0_4px_14px_rgba(162,114,77,0.25)] dark:bg-zinc-900"
            : "border-line bg-white dark:border-zinc-700 dark:bg-zinc-900"
        }`}
      >
        <p className="font-serif text-lg font-semibold text-ink dark:text-zinc-100">{zone.label}</p>
        {zone.heading && <p className="text-base text-ink dark:text-zinc-100">{zone.heading}</p>}
        {headerExtra}
        <div className="mt-2 h-px w-full bg-mist dark:bg-zinc-700" />

        {showsTodaysVerses && zone.startVerse !== undefined && zone.endVerse !== undefined && (
          <PericopeVerseGrid
            startVerse={zone.startVerse}
            endVerse={zone.endVerse}
            highlightedVerseNumbers={highlightedVerseNumbers}
            completedVerseNumbers={completedVerseNumbers}
            extra={verseGridExtra}
          />
        )}

        {activeSpillover && activeSpillover.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {activeSpillover.length === 1 ? "Today's Verse" : "Today's Verses"} — {formatVerseRangeLabel(activeSpillover)}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink dark:text-zinc-100">{activeSpillover.map((verse) => verse.text).join(" ")}</p>
          </div>
        )}

        <PericopeCardAction
          isSpilloverOnly={isSpilloverOnly}
          status={status}
          isTodaysLesson={isTodaysLesson && Boolean(actionDay)}
          todaysVerses={todaysVerses}
          actionLabel={actionLabel}
          onClick={handleClick}
        />
      </motion.div>
    </div>
  );
}
