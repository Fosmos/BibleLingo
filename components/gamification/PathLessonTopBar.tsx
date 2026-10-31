"use client";

import type { CSSProperties } from "react";
import { ChevronLeft } from "lucide-react";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { usePericopeHeading } from "@/lib/usePericopeHeading";
import { formatChapterLabel } from "@/lib/chapterContent";
import type { ParsedVerseKey } from "@/lib/verseKey";
import { PalacePlacementChip } from "@/components/gamification/PalacePlacementChip";

interface PathLessonTopBarProps {
  // The verse the lesson is on — its chapter and pericope.
  place: ParsedVerseKey;
  onClose: () => void;
}

// A lesson's top bar on the chapter reader: back at the left, the pericope (or the chapter), how far
// through the verse's stages it is, or a spaced review's score, and a progress bar under them.
// `data-lesson-top`: the reader scrolls the lesson's verses in beneath it (ChapterSenseReader.tsx).
export function PathLessonTopBar({ place, onClose }: PathLessonTopBarProps) {
  const stage = useLessonSessionStore((state) => state.sheetStage);
  const progress = useLessonSessionStore((state) => state.lessonProgress) ?? 0;
  const pericope = usePericopeHeading(place.book, place.chapter, place.verseNumber);
  const setReferenceBarNode = useLessonSessionStore((state) => state.setReferenceBarNode);
  const steps = stage?.steps ?? 1;
  const step = stage?.step ?? 0;
  const filled = steps > 1 ? (step + 1) / steps : progress;

  return (
    <div data-lesson-top className="fixed inset-x-0 top-0 z-40 bg-parchment/95 pt-[env(safe-area-inset-top)] backdrop-blur dark:bg-zinc-900/95">
      <div className="mx-auto flex max-w-2xl flex-col gap-1 px-4 pb-2.5">
        <div className="flex min-h-11 items-center gap-1.5">
          <button type="button" onClick={onClose} aria-label="Close lesson" className="-ml-2.5 flex h-11 w-11 shrink-0 items-center justify-center text-sand-700 dark:text-zinc-300">
            <ChevronLeft size={24} strokeWidth={2.75} />
          </button>
          <div className="flex min-w-0 flex-1 flex-col">
            {/* A recalled reference shows here (SheetVerseZone.tsx), in the pericope's place. */}
            <span ref={setReferenceBarNode} data-ref-slot className="flex items-center empty:hidden" />
            <span className="truncate text-[13px] font-extrabold text-sand-800 dark:text-zinc-300 [[data-ref-slot]:not(:empty)~&]:hidden">{pericope ?? formatChapterLabel(place.book, place.chapter)}</span>
            <PalacePlacementChip verse={place} />
          </div>
          {stage?.accuracy !== undefined && <span className={`shrink-0 rounded-md px-1.5 text-[12px] font-extrabold text-white ${stage.accuracy >= (stage.threshold ?? 90) ? "bg-sand-700" : "bg-brand-600"}`}>{Math.round(stage.accuracy)}%</span>}
          {steps > 1 && <span className="shrink-0 text-[13px] font-extrabold text-sand-800 dark:text-zinc-300">Step {step + 1} of {steps}</span>}
        </div>
        <div className="h-[7px] overflow-hidden rounded-full bg-sand-200 dark:bg-zinc-700" aria-hidden="true">
          <span style={{ "--w": `${Math.round(filled * 100)}%` } as CSSProperties} className="block h-full w-[var(--w)] rounded-full bg-brand-500 transition-[width]" />
        </div>
      </div>
    </div>
  );
}
