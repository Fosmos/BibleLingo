"use client";

import { Sword } from "lucide-react";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import { LeitnerBoxes } from "@/components/gamification/LeitnerBoxes";

// The Leitner-box view of every memorized verse group's current review cadence — separate
// from SrsOverview's "what's due right now" list, this shows the whole progression across
// all boxes in promotion order (see lib/srs.ts's BOX_ORDER and scheduleReview for the
// promotion/demotion rule). The "Box N" shown here is a display-only sequential number (see
// boxDisplayNumber) rather than the internal SrsBox id, so it always reads as ascending
// review frequency even though the id for "every 3 days" (added after 1-4 already existed)
// doesn't fall between 1 and 2. Each entity also shows its best-ever review score, if it has
// one, so that's visible here without having to start a review to see it. The reader can move
// any range up or down a box by hand (see LeitnerBoxes.tsx).
export function SwordOfTheSpirit() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-brand-50 p-5 shadow-sm dark:border dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
          <Sword size={15} />
        </span>
        <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
          Sword of the Spirit <InfoTip text={INFO_TIPS.swordOfTheSpirit} />
        </p>
      </div>
      <LeitnerBoxes />
    </div>
  );
}
