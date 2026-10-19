"use client";

import type { CSSProperties } from "react";
import { X } from "lucide-react";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { usePericopeHeading } from "@/lib/usePericopeHeading";
import { formatChapterLabel } from "@/lib/chapterContent";
import type { ParsedVerseKey } from "@/lib/verseKey";
import { DrillHelpChips } from "@/components/gamification/DrillHelpChips";

interface PathLessonTopBarProps {
  // The verse the lesson is on — its chapter and pericope.
  place: ParsedVerseKey;
  onClose: () => void;
}

// A lesson's top bar on the chapter reader, in one short row: close at the left; the stage's name
// (with its "2 of 4", or a spaced review's score) over the chapter and pericope; the Letters /
// Verse / Skip chips at the right (DrillHelpChips.tsx); and along its bottom edge, a thin step bar
// across the verse's run of stages (done sand, current terracotta) or the lesson's progress.
// `data-lesson-top`: the reader scrolls the lesson's verses in beneath it (ChapterSenseReader.tsx).
export function PathLessonTopBar({ place, onClose }: PathLessonTopBarProps) {
  const stage = useLessonSessionStore((state) => state.sheetStage);
  const progress = useLessonSessionStore((state) => state.lessonProgress) ?? 0;
  const pericope = usePericopeHeading(place.book, place.chapter, place.verseNumber);
  const setReferenceBarNode = useLessonSessionStore((state) => state.setReferenceBarNode);
  const steps = stage?.steps ?? 1;
  const step = stage?.step ?? 0;

  return (
    <div data-lesson-top className="fixed inset-x-0 top-0 z-40 bg-parchment/95 pt-[env(safe-area-inset-top)] shadow-organic-sm backdrop-blur dark:bg-zinc-900/95">
      <div className="mx-auto flex max-w-2xl items-center gap-2.5 px-3 py-2">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand-200 text-sand-700 hover:bg-sand-300 dark:bg-zinc-800 dark:text-zinc-200"
        >
          <X size={17} strokeWidth={3} />
        </button>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="flex min-w-0 items-center gap-1.5 text-[11.5px] font-black uppercase tracking-[.06em] text-brand-700 dark:text-brand-300">
            <span className="truncate">{stage?.label ?? ""}</span>
            {steps > 1 && <span className="shrink-0 text-sand-600 dark:text-zinc-500">{step + 1}/{steps}</span>}
            {stage?.accuracy !== undefined && (
              <span className={`shrink-0 rounded-md px-1.5 text-[11px] text-white ${stage.accuracy >= (stage.threshold ?? 90) ? "bg-sand-700" : "bg-brand-600"}`}>{Math.round(stage.accuracy)}%</span>
            )}
          </span>
          {/* A recalled reference shows here (SheetVerseZone.tsx), in the chapter line's place. */}
          <span ref={setReferenceBarNode} data-ref-slot className="flex items-center empty:hidden" />
          <span className="truncate text-[11px] font-bold text-ink-muted dark:text-zinc-500 [[data-ref-slot]:not(:empty)~&]:hidden">{[formatChapterLabel(place.book, place.chapter), pericope].filter(Boolean).join(" → ")}</span>
        </div>
        <DrillHelpChips inBar />
      </div>
      <div className="flex h-1 gap-[3px]" aria-hidden="true">
        {steps > 1 ? (
          Array.from({ length: steps }, (_, index) => (
            <span key={index} className={`flex-1 transition-colors ${index < step ? "bg-sand-600" : index === step ? "bg-brand-500" : "bg-sand-300 dark:bg-zinc-700"}`} />
          ))
        ) : (
          <span className="flex-1 bg-sand-300 dark:bg-zinc-700">
            <span style={{ "--w": `${Math.round(progress * 100)}%` } as CSSProperties} className="block h-full w-[var(--w)] bg-brand-500 transition-[width]" />
          </span>
        )}
      </div>
    </div>
  );
}
