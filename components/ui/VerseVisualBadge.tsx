"use client";

import { furnitureIcon } from "@/lib/furnitureIcons";

interface VerseVisualBadgeProps {
  furnitureLabel: string;
  who: string;
  action: string;
  additionalInfo: string;
}

// A persistent reminder of this verse's own Who/Action scene (see
// VerseOrientationSummaryRep.tsx), pinned to the top-right corner through every stage after
// Visualize — the room item plus the reader's own POA, the same pieces shown on its
// Building-view lesson circle (see DayCircle.tsx). z-[60] so it sits above DrawFirstLetterRep's
// own full-screen overlay (z-50).
export function VerseVisualBadge({ furnitureLabel, who, action, additionalInfo }: VerseVisualBadgeProps) {
  if (!who && !action) return null;
  return (
    <div className="fixed right-3 top-3 z-[60] flex max-w-[45%] items-center gap-1.5 rounded-full border border-line bg-white/90 px-2.5 py-1 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90">
      {furnitureIcon(furnitureLabel, 16)}
      <span className="truncate text-xs font-medium text-ink-soft dark:text-zinc-300">
        {[who, action, additionalInfo].filter(Boolean).join(" ")}
      </span>
    </div>
  );
}
