"use client";

import type { Ref } from "react";
import { motion } from "framer-motion";
import { Check, Lock } from "lucide-react";
import { versesByPericopeSegment, type PathZone } from "@/lib/pathZones";
import type { PericopeCardState } from "@/lib/pericopeCardState";
import { dayLabel } from "@/components/gamification/DayCircle";
import { formatVerseRangeLabel } from "@/lib/chapterContent";
import { MOTION_DURATION, TAP_SCALE } from "@/lib/motionTokens";

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
}

// One pericope's own row: a rail circle straddling its card's own top-left corner (checked
// once done, glowing on the current one, locked-outline otherwise), a thick dotted line
// running the full row height behind it to connect to its neighbors, and the card itself —
// verse-reference/heading header, then, on whichever card(s) actually show today's verses, a
// 5-column grid of every verse in that section (V.9, V.10, ...): today's own verses
// highlighted, verses already finished in an earlier lesson faded a distinct tinted color with
// a checkmark, and verses not yet reached plain-faded — then either the active card's own
// "Today's Verse(s)"
// preview (reference + full text) with a plain "Learn" button, or, for every other card, a
// single button that replays a finished pericope, previews a not-yet-reached one, or opens
// whatever capstone day (Weekly Review, Boss Battle, ...) happens to be active here instead
// of a learn day — see lib/pericopeCardState.ts. Locked only changes how the button looks,
// not whether it works: every pericope stays reachable regardless of lock state, same as
// DayCircle's own onSelect always was. Every card actually showing today's verses (the
// home section with the button, and any earlier section a lesson merely spills through —
// see lib/pathZones.ts) stays at full strength; every other one fades back so it reads as
// "not now." A spillover-only card (part of today's lesson, but not its home) drops its own
// independent button entirely and merges visually into its connected neighbor — the one
// "Learn" button for the whole lesson lives only in the home section.
export function PericopeCard({ zone, state, index, isLast, completedDays, connectToPrevious, connectToNext, cardRef, onSelectDay, onPracticeDay }: PericopeCardProps) {
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
  // section that actually has the "Learn" button, so it drops the button entirely.
  const isSpilloverOnly = hasActiveSpillover && !isTodaysLesson;
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

  const circleColorClass = isCompleted
    ? "bg-brand-600 text-white"
    : isActive
      ? "bg-brand-500 text-white"
      : "border-2 border-line bg-white text-ink-muted dark:border-zinc-700 dark:bg-zinc-900";
  const lineColorClass = isCompleted ? "border-brand-600" : isActive ? "border-brand-500" : "border-line dark:border-zinc-700";

  function handleClick() {
    if (!actionDay) return;
    if (actionKind === "practice") onPracticeDay(actionDay.dayNumber);
    else onSelectDay(actionDay.dayNumber);
  }

  return (
    <div className={`flex w-full gap-0 ${connectToNext ? "pb-0" : "pb-4"}`}>
      <div className="relative flex w-14 shrink-0 flex-col items-center">
        {!isLast && <div className={`absolute inset-y-0 border-l-4 border-dotted ${lineColorClass}`} aria-hidden="true" />}
        <div
          className={`relative z-10 mt-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${circleColorClass} ${
            isActive ? "shadow-[0_4px_14px_rgba(162,114,77,0.4)]" : ""
          }`}
        >
          {isCompleted ? <Check size={20} /> : !isActive ? <Lock size={16} /> : null}
        </div>
      </div>

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
        <div className="mt-2 h-px w-full bg-mist dark:bg-zinc-700" />

        {showsTodaysVerses && zone.startVerse !== undefined && zone.endVerse !== undefined && (
          <div className="mt-3 grid grid-cols-5 gap-1.5">
            {Array.from({ length: zone.endVerse - zone.startVerse + 1 }, (_, i) => zone.startVerse! + i).map((verseNumber) => {
              const isHighlighted = highlightedVerseNumbers.has(verseNumber);
              const isVerseCompleted = completedVerseNumbers.has(verseNumber);
              return (
                <div
                  key={verseNumber}
                  className={`flex items-center justify-center gap-0.5 rounded-md py-1.5 text-[10px] font-semibold ${
                    isHighlighted
                      ? "bg-brand-500 text-white"
                      : isVerseCompleted
                        ? "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                        : "bg-mist text-ink-muted dark:bg-zinc-800 dark:text-zinc-500"
                  }`}
                >
                  V.{verseNumber}
                  {isVerseCompleted && <Check size={10} />}
                </div>
              );
            })}
          </div>
        )}

        {activeSpillover && activeSpillover.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {activeSpillover.length === 1 ? "Today's Verse" : "Today's Verses"} — {formatVerseRangeLabel(activeSpillover)}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink dark:text-zinc-100">{activeSpillover.map((verse) => verse.text).join(" ")}</p>
          </div>
        )}

        {isSpilloverOnly ? null : status === "locked" ? (
          <motion.button
            type="button"
            whileTap={TAP_SCALE}
            onClick={handleClick}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-line py-2 text-sm text-ink-muted dark:border-zinc-700"
          >
            <Lock size={14} /> Locked
          </motion.button>
        ) : isTodaysLesson && actionDay ? (
          <div className="mt-3 flex flex-col gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {todaysVerses.length === 1 ? "Today's Verse" : "Today's Verses"} — {formatVerseRangeLabel(todaysVerses)}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink dark:text-zinc-100">{todaysVerses.map((verse) => verse.text).join(" ")}</p>
            </div>
            <motion.button
              type="button"
              whileTap={TAP_SCALE}
              onClick={handleClick}
              className="w-full rounded-full bg-brand-500 py-2 text-sm font-semibold text-white"
            >
              Learn
            </motion.button>
          </div>
        ) : (
          <motion.button
            type="button"
            whileTap={TAP_SCALE}
            onClick={handleClick}
            className="mt-3 w-full rounded-full bg-brand-500 py-2 text-sm font-semibold text-white"
          >
            {actionLabel}
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
