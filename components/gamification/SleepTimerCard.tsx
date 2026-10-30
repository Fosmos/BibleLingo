"use client";

import { useState } from "react";
import { Moon } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { getMemorizedEntityVerses } from "@/lib/progressSummary";
import { SleepTimerView } from "@/components/gamification/SleepTimerView";

// Profile's own manual entry point for SleepTimerView.tsx — unlike VespersPromptCard.tsx this
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
    // The Organic restyle's dark evening card (warm neutral, terracotta accents).
    <div className="flex items-center gap-3.5 rounded-organic bg-sand-900 p-[22px]">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sand-800 text-brand-400">
        <Moon size={19} strokeWidth={2.75} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-[15px] font-bold text-brand-100">Sleep Timer</p>
        <p className="text-[13px] leading-snug text-sand-400">Drift off listening to your own memorized verses, read aloud on a loop.</p>
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-full border-[1.5px] border-sand-700 px-4 py-[9px] text-sm text-brand-200 hover:bg-sand-800"
      >
        Start
      </button>
    </div>
  );
}
