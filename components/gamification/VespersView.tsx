"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { MemorizationDay, VerseSegment } from "@/types";
import { useChapterScopedReadingLayout } from "@/lib/useChapterScopedReadingLayout";
import { FirstLetterTypeRep } from "@/components/drills/FirstLetterTypeRep";
import { ChapterFitProbes } from "@/components/gamification/ChapterFitProbes";

interface VespersViewProps {
  verses: VerseSegment[];
  // The active path's own full day plan plus which day these `verses` belong to — everything
  // lib/useChapterScopedReadingLayout.ts needs to build the SAME real reading-view page(s) the
  // Path screen itself would show for this chapter (see VespersPromptCard.tsx, the only
  // caller — `verses` and `activeDay` always come from the same lastCompletedDay, so every
  // verse here genuinely sits on the page(s) this layout resolves).
  days: MemorizationDay[];
  activeDay: MemorizationDay;
  completedDays: number;
  todaysDay: number;
  onDone: () => void;
}

// The evening wind-down screen itself (see UserProgress.vespersHour), deliberately its own
// fixed warm-on-black FRAME (vespers-* in tailwind.config.ts) rather than this app's usual
// light/dark theme pair, chosen to cut blue light before bed. Prompts real recall, one
// previous-lesson verse at a time — first-letter typing, the exact same drill/reveal mechanic
// SRS review already uses (FirstLetterTypeRep, reused as-is), not a passive re-read: the point
// is one deliberate retrieval attempt right before sleep, not just seeing the words again. The
// verse itself renders on the SAME real, paginated reading-view page (see
// lib/useChapterScopedReadingLayout.ts) every other recall surface in this app now shares —
// the same fixed size/position a reader would already recognize it from, which is part of what
// actually aids recall, rather than a smaller one-off card built just for this screen. The
// drill card stays in the app's own normal light/dark treatment rather than the vespers
// palette — the on-screen keyboard needs real contrast to actually type against — so only the
// surrounding frame (background, header, recall progress) carries the warm-on-black look.
// Progress-neutral by design: finishing or skipping never touches SRS boxes, streaks, or
// Problem Verses — a calm moment, not a graded one.
export function VespersView({ verses, days, activeDay, completedDays, todaysDay, onDone }: VespersViewProps) {
  const [index, setIndex] = useState(0);
  const verse = verses[index];
  const layout = useChapterScopedReadingLayout(days, activeDay, completedDays, todaysDay);
  // Destructured into plain local bindings before the JSX below — see LessonChrome.tsx's own
  // identical comment on why (this codebase's react-hooks/refs lint rule).
  const {
    bodyTopRef,
    probeContainerRef,
    pages,
    fillHeightPx,
    dayNumberByVerse,
    todaysVerseNumbers,
    completedDays: layoutCompletedDays,
    locationTags,
    iconTags,
    pegActive,
  } = layout;

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
      <div ref={bodyTopRef} />
      <div className="mx-auto w-full max-w-2xl px-4">
        <ChapterFitProbes
          ref={probeContainerRef}
          pages={pages}
          fillHeightPx={fillHeightPx}
          dayNumberByVerse={dayNumberByVerse}
          todaysVerseNumbers={todaysVerseNumbers}
          completedDays={layoutCompletedDays}
          locationTags={locationTags}
          iconTags={iconTags}
          pegActive={pegActive}
        />
      </div>
      {verse && (
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 px-4 pt-3">
          <FirstLetterTypeRep
            key={`vespers-${index}`}
            verse={verse}
            reps={1}
            restartOnMistake={false}
            stageLabel="Recall it before bed"
            lettersOnly
            allowPeekHint
            layout={layout}
            onComplete={() => next()}
          />
        </div>
      )}
    </div>
  );
}
