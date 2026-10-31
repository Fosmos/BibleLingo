"use client";

import { useEffect } from "react";
import { MapPin } from "lucide-react";
import type { VerseSegment } from "@/types";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import type { SenseLineWordRange } from "@/lib/senseLineWordRanges";
import { useVersePlacement } from "@/lib/useVersePlacement";
import { LessonPageCard } from "@/components/gamification/LessonPageCard";
import { LessonControlBar } from "@/components/gamification/LessonControlBar";

interface PalacePlaceStepProps {
  verse: VerseSegment;
  layout: ChapterReadingLayout;
  onComplete: () => void;
}

// A Learn lesson's first stage for a verse already on a spot in the reader's palace (lib/learnSteps.ts):
// the verse on its page, and below it, the walk to its spot and the scene to picture. Verses aren't
// assigned to spots in a lesson, so one with no spot goes straight on.
export function PalacePlaceStep({ verse, layout, onComplete }: PalacePlaceStepProps) {
  const { placement } = useVersePlacement({ book: verse.book, chapter: verse.chapter, verseNumber: verse.verseNumber });
  const unplaced = !placement;
  useEffect(() => {
    if (unplaced) onComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unplaced]);
  const renderActiveVerse = (_: VerseSegment, range: SenseLineWordRange) => <>{range.clause.text}</>;
  if (!placement) return null;

  return (
    <div className="flex flex-col gap-3">
      <LessonPageCard layout={layout} activeVerse={verse} renderActiveVerse={renderActiveVerse} />
      <LessonControlBar dockRef={layout.dockRef} verseText={verse.text}>
        <div className="flex w-full max-w-md flex-col gap-2 self-center">
          <span className="flex items-center gap-1.5 text-[13px] font-black text-brand-700 dark:text-brand-300">
            <MapPin size={16} strokeWidth={2.75} />
            {`Walk to ${placement.room.name} › ${placement.locus.name || "its spot"}`}
          </span>
          {placement.locus.scene && <p className="text-[14px] italic text-ink dark:text-zinc-100">{placement.locus.scene}</p>}
          <button type="button" onClick={onComplete} className="self-center rounded-full bg-brand-500 px-6 py-2 text-sm font-black text-white shadow-[0_3px_0_#8C491A]">
            Continue
          </button>
        </div>
      </LessonControlBar>
    </div>
  );
}
