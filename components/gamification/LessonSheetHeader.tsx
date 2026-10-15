"use client";

import type { CSSProperties } from "react";
import { X } from "lucide-react";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";

interface LessonSheetHeaderProps {
  onClose: () => void;
}

// A lesson's header (design_handoff_lesson_view): close, the step bar across the current verse's
// run of stages (done sand, current terracotta, to come pale) with its "2 of 4", a spaced review's
// live score, and the stage's name under it — hidden once the verse zone goes compact to fit
// (lib/useVerseFit.ts). All reported by whichever screen is running (lib/useReportSheetStage.ts).
export function LessonSheetHeader({ onClose }: LessonSheetHeaderProps) {
  const stage = useLessonSessionStore((state) => state.sheetStage);
  const compactFit = useLessonSessionStore((state) => state.verseCompactFit);
  const progress = useLessonSessionStore((state) => state.lessonProgress) ?? 0;
  const steps = stage?.steps ?? 1;
  const step = stage?.step ?? 0;

  return (
    <div className="flex shrink-0 flex-col gap-2 px-4 pb-1.5 pt-1">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-sand-200 text-sand-700 hover:bg-sand-300 dark:bg-zinc-800 dark:text-zinc-200"
        >
          <X size={18} strokeWidth={3} />
        </button>
        {steps > 1 ? (
          <>
            <div className="flex flex-1 gap-[5px]" aria-hidden="true">
              {Array.from({ length: steps }, (_, index) => (
                <span key={index} className={`h-2.5 flex-1 rounded-full transition-colors ${index < step ? "bg-sand-700" : index === step ? "bg-brand-500" : "bg-sand-300 dark:bg-zinc-700"}`} />
              ))}
            </div>
            <span className="whitespace-nowrap text-[12.5px] font-black text-sand-700 dark:text-zinc-400">
              {step + 1} of {steps}
            </span>
          </>
        ) : (
          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-sand-300 dark:bg-zinc-700" aria-hidden="true">
            <span style={{ "--w": `${Math.round(progress * 100)}%` } as CSSProperties} className="block h-full w-[var(--w)] rounded-full bg-brand-500 transition-[width]" />
          </span>
        )}
        {stage?.accuracy !== undefined && (
          <span className={`shrink-0 rounded-[10px] px-2.5 py-1 text-[13px] font-black text-white ${stage.accuracy >= (stage.threshold ?? 90) ? "bg-sand-700" : "bg-brand-600"}`}>{Math.round(stage.accuracy)}%</span>
        )}
      </div>
      {stage && !compactFit && <span className="px-1.5 pt-1.5 text-[11.5px] font-black uppercase tracking-[.08em] text-brand-700 dark:text-brand-300">{stage.label}</span>}
    </div>
  );
}
