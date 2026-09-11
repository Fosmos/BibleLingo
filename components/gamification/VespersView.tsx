"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { VerseSegment } from "@/types";
import { FirstLetterTypeRep } from "@/components/drills/FirstLetterTypeRep";

interface VespersViewProps {
  verses: VerseSegment[];
  onDone: () => void;
}

// The evening wind-down screen itself (see UserProgress.vespersHour) — deliberately its own
// fixed warm-on-black FRAME (vespers-* in tailwind.config.ts), not this app's usual light/dark
// theme pair, chosen to cut blue light before bed. Prompts real recall, one previous-lesson
// verse at a time — first-letter typing, the exact same drill/reveal mechanic SRS review
// already uses (FirstLetterTypeRep, reused as-is), not a passive re-read: the point is one
// deliberate retrieval attempt right before sleep, not just seeing the words again. The drill
// card itself stays in the app's own normal light/dark card treatment rather than the vespers
// palette — the on-screen keyboard needs real contrast to actually type against, so only the
// surrounding frame (background, header, recall progress) carries the warm-on-black look.
// Progress-neutral by design: finishing or skipping never touches SRS boxes, streaks, or
// Problem Verses — a calm moment, not a graded one.
export function VespersView({ verses, onDone }: VespersViewProps) {
  const [index, setIndex] = useState(0);
  const verse = verses[index];

  function next() {
    if (index + 1 >= verses.length) onDone();
    else setIndex(index + 1);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-vespers-bg">
      <div className="flex items-center justify-between p-4">
        <p className="text-xs font-medium uppercase tracking-widest text-vespers-soft">
          Recall {index + 1} of {verses.length}
        </p>
        <button
          type="button"
          onClick={onDone}
          aria-label="Close Vespers mode"
          className="flex h-10 w-10 items-center justify-center rounded-full text-vespers-soft hover:bg-vespers-surface"
        >
          <X size={20} />
        </button>
      </div>
      {/* items-center alone, deliberately no justify-center: centering a taller-than-
          viewport card on BOTH axes pushes its own top (the stage label, pericope heading,
          verse reference) above the scrollable area's own top edge — reachable only by
          scrolling up, which a reader has no reason to think to do. Flowing from the top
          instead means the card's own beginning is always the first thing on screen; only a
          card that genuinely needs more room scrolls at all, and doing so reveals more of the
          SAME card growing downward, never content hidden above. */}
      <div className="flex flex-1 flex-col items-center gap-4 overflow-y-auto px-4 pb-10 pt-2">
        {verse && (
          <div className="w-full max-w-md shrink-0 rounded-2xl bg-white p-5 shadow-lg dark:bg-zinc-900">
            <FirstLetterTypeRep
              key={`vespers-${index}`}
              verse={verse}
              reps={1}
              restartOnMistake={false}
              stageLabel="Recall it before bed"
              lettersOnly
              allowPeekHint
              onComplete={() => next()}
            />
          </div>
        )}
      </div>
    </div>
  );
}
