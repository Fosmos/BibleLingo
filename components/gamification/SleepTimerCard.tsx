"use client";

import { useState } from "react";
import { Moon } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { getMemorizedEntityVerses } from "@/lib/progressSummary";
import { SleepTimerView } from "@/components/gamification/SleepTimerView";

// Home's own manual entry point for SleepTimerView.tsx — unlike VespersPromptCard.tsx this
// isn't time-gated or dismissible-for-the-day: falling asleep to a review isn't tied to a
// specific evening hour the way the Vespers nudge is, so it's just always here to open when
// the reader wants it. Hidden outright (not even a collapsed placeholder, same convention
// VespersPromptCard follows) once there's nothing memorized yet to build a playlist from.
export function SleepTimerCard() {
  const memorizedEntities = useProgressStore((state) => state.memorizedEntities);
  const [open, setOpen] = useState(false);

  const verses = getMemorizedEntityVerses(memorizedEntities);
  if (verses.length === 0) return null;
  if (open) return <SleepTimerView verses={verses} onDone={() => setOpen(false)} />;

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-vespers-bg p-5 text-vespers-ink shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-vespers-surface">
          <Moon size={16} className="text-vespers-accent" />
        </span>
        <p className="text-sm font-semibold">Sleep Timer</p>
      </div>
      <p className="text-sm text-vespers-soft">Drift off listening to your own memorized verses, read aloud on a loop.</p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start rounded-full border border-vespers-soft/30 px-4 py-2 text-sm font-medium hover:bg-vespers-surface"
      >
        Start
      </button>
    </div>
  );
}
