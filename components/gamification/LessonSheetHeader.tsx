"use client";

import { X } from "lucide-react";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";

interface LessonSheetHeaderProps {
  onClose: () => void;
}

// The Mind Map lesson sheet's header (the Organic restyle): a close button, a step bar across the
// current verse's run of stages with its "2 of 4" count, then the stage's name over the verse it
// drills — all reported by whichever screen is in the sheet (lib/useReportSheetStage.ts). A
// compact stage (spaced review) drops the label and shows just the current verse beside the close.
export function LessonSheetHeader({ onClose }: LessonSheetHeaderProps) {
  const stage = useLessonSessionStore((state) => state.sheetStage);

  return (
    <div className="flex shrink-0 flex-col gap-2 px-4 pb-1.5 pt-3">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-sand-200 text-sand-800 hover:bg-sand-300 dark:bg-zinc-800 dark:text-zinc-200"
        >
          <X size={16} strokeWidth={2.75} />
        </button>
        {stage?.compact && (
          <span className="min-w-0 shrink truncate whitespace-nowrap font-serif text-xl leading-[1.1] text-ink dark:text-zinc-100">{stage.reference}</span>
        )}
        {stage && stage.steps > 1 ? (
          <>
            <div className="flex flex-1 gap-[5px]" aria-hidden="true">
              {Array.from({ length: stage.steps }, (_, index) => (
                <span
                  key={index}
                  className={`h-2 flex-1 rounded-full ${index < stage.step ? "bg-sage-600" : index === stage.step ? "bg-brand-500" : "bg-sand-300 dark:bg-zinc-700"}`}
                />
              ))}
            </div>
            <span className="whitespace-nowrap text-[13px] font-bold text-ink-muted">
              {stage.step + 1} of {stage.steps}
            </span>
          </>
        ) : (
          <span className="flex-1" />
        )}
      </div>
      {stage && !stage.compact && (
        <div className="flex flex-col gap-px">
          <span className="text-[11px] font-bold uppercase tracking-[.06em] text-brand-700 dark:text-brand-300">{stage.label}</span>
          <span className="truncate whitespace-nowrap font-serif text-xl leading-[1.1] text-ink dark:text-zinc-100">{stage.reference}</span>
        </div>
      )}
    </div>
  );
}
