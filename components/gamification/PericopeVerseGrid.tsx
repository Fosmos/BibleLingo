"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";

interface PericopeVerseGridProps {
  startVerse: number;
  endVerse: number;
  highlightedVerseNumbers: Set<number>;
  completedVerseNumbers: Set<number>;
  // Extra content (Building view's per-verse location/peg tags — see BuildingRoomView.tsx)
  // rendered right below the grid. Only relevant while the grid itself is showing, so a
  // caller never needs to duplicate PericopeCard's own isEmphasized gating just to know
  // when this should render.
  extra?: ReactNode;
}

// Split out of PericopeCard.tsx purely to keep that file under this codebase's 200-line cap.
// The 5-column V.1/V.2/... grid: today's own verses highlighted, verses already finished in
// an earlier lesson faded a distinct tinted color with a checkmark, verses not yet reached
// plain-faded.
export function PericopeVerseGrid({ startVerse, endVerse, highlightedVerseNumbers, completedVerseNumbers, extra }: PericopeVerseGridProps) {
  return (
    <>
      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {Array.from({ length: endVerse - startVerse + 1 }, (_, i) => startVerse + i).map((verseNumber) => {
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
      {extra}
    </>
  );
}
