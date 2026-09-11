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
import { PericopeCompactRow } from "@/components/gamification/PericopeCompactRow";

interface PericopeCardProps {
  zone: PathZone;
  state: PericopeCardState;
  index: number;
  isLast: boolean;
  completedDays: number;
  // Whichever day counts as TODAY's own lesson (lib/dayRollover.ts's todaysDayNumber) — this card's own spillover lookup below.
  todaysDayNumber: number;
  // Whether the card immediately before/after this one in the list is also part of today's
  // one active lesson (see lib/pericopeCardState.ts's zoneShowsTodaysVerses) — when either
  // is true, this card visually merges into that neighbor instead of reading as its own
  // separate box, since together they're really just one lesson's verses split across
  // sections. Only ever true while a lesson is actually spanning multiple pericopes (so both
  // sides are emphasized — see isEmphasized below).
  connectToPrevious: boolean;
  connectToNext: boolean;
  // Set only on the currently-emphasized card — see PathDayList.tsx, which scrolls to
  // whichever card holds this ref the moment the path view opens.
  cardRef?: Ref<HTMLDivElement>;
  onSelectDay: (dayNumber: number) => void;
  onPracticeDay: (dayNumber: number) => void;
  // Building view only (see BuildingRoomView.tsx) — this section's own pericope-level
  // location/peg tags, rendered right under the heading; and this section's per-verse tags,
  // rendered right under the verse grid. Undefined outside Building view, and never rendered
  // on a collapsed PericopeCompactRow — Building view's own tags only ever make sense once a
  // section is actually showing its verses.
  headerExtra?: ReactNode;
  verseGridExtra?: ReactNode;
}

// One pericope (or capstone day)'s own row in the path list. Only the ONE card that's
// actually relevant right now — the active lesson, an active capstone day (Full Review, Boss
// Battle, ...), or an earlier section a lesson merely spills through on its way there — gets
// the full treatment: a bordered card, its per-verse grid, a text preview, and an action
// button. Every other card (not yet reached, or already finished) collapses into a single
// compact, chrome-free row instead (see PericopeCompactRow.tsx) — so a long path reads as a
// short, scannable list with one clear "you are here" card, not a wall of near-identical
// boxes. A rail circle (checked once done, glowing on the emphasized card, locked-outline
// otherwise — see PericopeCardRail.tsx) plus a dotted connector line runs down the left side
// of every row either way.
export function PericopeCard({
  zone,
  state,
  index,
  isLast,
  completedDays,
  todaysDayNumber,
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
  // The one case with an actual "today" to name — every other active day (a capstone's own button) or compact row is a plain single-line label.
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
  const activeSpillover = zone.spilloverVerses?.find((entry) => entry.dayNumber === todaysDayNumber)?.verses;
  const hasActiveSpillover = (activeSpillover?.length ?? 0) > 0;
  // The one tier that gets the full card treatment. A "locked"-status zone can still land here
  // (see lib/pericopeCardState.ts), so this is its own check, not just `isActive`.
  const isEmphasized = isActive || hasActiveSpillover;
  // A pure continuation of today's lesson into an earlier section — its own independent
  // action would be redundant right above the section that actually has the "Learn" button,
  // so it drops the button entirely. Same for a pericope so short it never gets a home day of
  // its own (see lib/pericopeCardState.ts) — nothing of its own left to replay once done.
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
  // Never overlaps highlightedVerseNumbers: todaysDayNumber is never <= completedDays (see lib/dayRollover.ts).
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

  // A capstone day (Full Review, Boss Battle, ...) has no pericope heading of its own (see
  // lib/pathZones.ts) — show its actual kind as the bold headline instead of just its bare
  // verse range, so a not-yet-reached one reads as "Boss Battle" rather than a generic
  // "Locked" range with no hint of what it actually is.
  const capstoneDay = zone.heading === "" && zone.days.length === 1 && zone.days[0].kind !== "learn" ? zone.days[0] : undefined;
  const primaryLabel = capstoneDay ? dayLabel(capstoneDay) : zone.label;
  const secondaryLabel = capstoneDay ? zone.label : zone.heading;

  const actionLabel = !actionDay ? "" : actionKind === "practice" ? "Review" : actionDay.kind !== "learn" ? dayLabel(actionDay) : "";

  function handleClick() {
    if (!actionDay) return;
    if (actionKind === "practice") onPracticeDay(actionDay.dayNumber);
    else onSelectDay(actionDay.dayNumber);
  }

  if (!isEmphasized) {
    return (
      <div className="flex w-full gap-0">
        <PericopeCardRail isLast={isLast} isCompleted={isCompleted} isEmphasized={false} />
        <PericopeCompactRow
          primaryLabel={primaryLabel}
          secondaryLabel={secondaryLabel}
          isCompleted={isCompleted}
          hasAction={Boolean(actionDay)}
          onClick={handleClick}
          headerExtra={headerExtra}
        />
      </div>
    );
  }

  return (
    <div className={`flex w-full gap-0 ${connectToNext ? "pb-0" : "pb-4"}`}>
      <PericopeCardRail isLast={isLast} isCompleted={isCompleted} isEmphasized />

      <motion.div
        ref={cardRef}
        initial={{ y: 8 }}
        animate={{ y: 0 }}
        transition={{ delay: index * 0.05, duration: MOTION_DURATION.base }}
        className={`-ml-7 w-full rounded-t-2xl rounded-b-2xl border border-brand-500 bg-white p-5 pl-11 shadow-[0_4px_14px_rgba(107,86,68,0.18)] dark:bg-zinc-900 ${
          connectToPrevious ? "rounded-t-none border-t-0" : ""
        } ${connectToNext ? "rounded-b-none border-b-0" : ""}`}
      >
        <p className="font-serif text-lg font-semibold text-ink dark:text-zinc-100">{primaryLabel}</p>
        {secondaryLabel && <p className="text-base text-ink-soft dark:text-zinc-300">{secondaryLabel}</p>}
        {headerExtra}
        <div className="mt-3 h-px w-full bg-mist dark:bg-zinc-700" />

        {/* Only worth the space when it's actually doing something — anchoring Building
            view's own per-verse tag chips (verseGridExtra). Otherwise the text preview below
            already says which verses are today's, so the grid would be pure decoration. */}
        {verseGridExtra && zone.startVerse !== undefined && zone.endVerse !== undefined && (
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
          isTodaysLesson={isTodaysLesson && Boolean(actionDay)}
          todaysVerses={todaysVerses}
          actionLabel={actionLabel}
          onClick={handleClick}
        />
      </motion.div>
    </div>
  );
}
