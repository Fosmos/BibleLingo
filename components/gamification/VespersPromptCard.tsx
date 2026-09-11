"use client";

import { useState } from "react";
import { MoonStar } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { useTodaysDay } from "@/lib/useTodaysDay";
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
  const { lastCompletedDay } = useTodaysDay();
  const [open, setOpen] = useState(false);

  const verses = lastCompletedDay?.newVerses.slice(0, MAX_VESPERS_VERSES) ?? [];
  const isEvening = vespersHour !== null && new Date().getHours() >= vespersHour;
  const dismissedToday = dismissedDate === todayDateKey();

  if (!isEvening || dismissedToday || verses.length === 0) return null;
  if (open) return <VespersView verses={verses} onDone={() => setOpen(false)} />;

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-vespers-bg p-5 text-vespers-ink shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-vespers-surface">
          <MoonStar size={16} className="text-vespers-accent" />
        </span>
        <p className="text-sm font-semibold">Wind down with a review</p>
      </div>
      <p className="text-sm text-vespers-soft">Reviewing right before sleep tends to help it stick.</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex-1 rounded-full border border-vespers-soft/30 py-2 text-sm font-medium hover:bg-vespers-surface"
        >
          Review now
        </button>
        <button type="button" onClick={dismissToday} className="rounded-full px-3 py-2 text-sm text-vespers-soft hover:bg-vespers-surface">
          Not tonight
        </button>
      </div>
    </div>
  );
}
