"use client";

import { useState } from "react";
import { MoonStar } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { useTodaysDay } from "@/lib/useTodaysDay";
import { todaysDayNumber } from "@/lib/dayRollover";
import { todayDateKey } from "@/lib/dateKey";
import { VespersView } from "@/components/gamification/VespersView";

// How many verses one bedtime session prompts recall for — a heavier lesson (book mode
// especially) can teach well more than this in one day, far too much for a calm moment right
// before sleep, so this always caps to a small handful.
const MAX_VESPERS_VERSES = 3;

// Home's own evening nudge (see UserProgress.vespersHour, set in Profile > Advanced) —
// appears only once the local clock reaches the reader's own chosen wind-down hour, and only
// while there's actually a lesson's own new verses to prompt recall of. Deliberately today's
// (the most recent lesson's) own newVerses, not older SRS-due material — a fresh retrieval
// attempt on what was JUST learned, right before the sleep that's meant to help consolidate
// it. Nothing appears at all otherwise, not even a collapsed placeholder. "Not tonight"
// dismisses it for the rest of the calendar day (dismissVespersPromptToday) rather than
// turning the feature off, so it comes back tomorrow evening on its own.
export function VespersPromptCard() {
  const vespersHour = useProgressStore((state) => state.vespersHour);
  const dismissedDate = useProgressStore((state) => state.vespersPromptDismissedDate);
  const dismissToday = useProgressStore((state) => state.dismissVespersPromptToday);
  // lastCompletedDay, not currentDay — Vespers reviews what was actually just learned, which
  // is always today's most recently FINISHED lesson, never a preview of one not yet taught
  // (see lib/useTodaysDay.ts's own doc comment on the two).
  const { plan, days, lastCompletedDay } = useTodaysDay();
  const [open, setOpen] = useState(false);

  const verses = lastCompletedDay?.newVerses.slice(0, MAX_VESPERS_VERSES) ?? [];
  const isEvening = vespersHour !== null && new Date().getHours() >= vespersHour;
  const dismissedToday = dismissedDate === todayDateKey();

  if (!isEvening || dismissedToday || verses.length === 0) return null;
  // `days`/`plan` are guaranteed set whenever `lastCompletedDay` (and so `verses`) is — both
  // come from the same useTodaysDay() resolution — so this is just satisfying TypeScript, not
  // a real runtime gate.
  if (open && days && plan && lastCompletedDay) {
    return (
      <VespersView
        verses={verses}
        days={days}
        activeDay={lastCompletedDay}
        completedDays={plan.completedDays}
        todaysDay={todaysDayNumber(plan, new Date())}
        onDone={() => setOpen(false)}
      />
    );
  }

  return (
    // The Organic restyle's dark evening card (warm neutral, terracotta accents).
    <div className="relative flex flex-col gap-2.5 overflow-hidden rounded-organic bg-sand-900 p-[22px] text-brand-200">
      <div aria-hidden="true" className="pointer-events-none absolute -right-[30px] -top-[40px] h-[120px] w-[120px] rounded-full bg-sand-800" />
      <div className="relative flex items-center gap-2.5">
        <MoonStar size={20} strokeWidth={2.75} className="text-brand-400" />
        <p className="font-serif text-xl text-brand-100">Wind down with a review</p>
      </div>
      <p className="relative text-[15px] leading-snug text-sand-300">Reviewing right before sleep tends to help it stick.</p>
      <div className="relative flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex-1 rounded-full bg-brand-500 py-[11px] text-[15px] font-semibold text-paper hover:bg-brand-600"
        >
          Review now
        </button>
        <button type="button" onClick={dismissToday} className="rounded-full px-4 py-[11px] text-[15px] text-sand-300 hover:bg-sand-800">
          Not tonight
        </button>
      </div>
    </div>
  );
}
