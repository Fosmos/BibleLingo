"use client";

import { useEffect } from "react";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { lessonPrompt, stageHasHelp } from "@/lib/lessonPrompts";
import type { Peek } from "@/lib/peek";

// The lesson page tray's first row (design_handoff_lesson_view): what the stage asks on the left,
// three chips on the right — Letters and Verse peek at the hidden words (lib/peek.ts; one at a
// time, off again when the stage changes) and Skip moves past the stage (its testing shortcut,
// AutoCompleteButton.tsx). No chips on Listen and Pray.
export function DrillHelpChips() {
  const stage = useLessonSessionStore((state) => state.sheetStage);
  const peek = useLessonSessionStore((state) => state.peek);
  const setPeek = useLessonSessionStore((state) => state.setPeek);
  const skip = useLessonSessionStore((state) => state.skipStage);
  const trayPrompt = useLessonSessionStore((state) => state.trayPrompt);
  const stageKey = stage ? `${stage.label}|${stage.reference}|${stage.step}` : "";

  // A new stage (or a new step within one, which brings its own Skip) starts unpeeked.
  useEffect(() => {
    setPeek(null);
  }, [stageKey, skip, setPeek]);
  useEffect(() => () => setPeek(null), [setPeek]);

  const prompt = trayPrompt ?? lessonPrompt(stage?.label);
  const help = stageHasHelp(stage?.label);
  if (!prompt && !help) return null;
  const toggle = (kind: Exclude<Peek, null>) => setPeek(peek === kind ? null : kind);

  return (
    <div className="flex items-center gap-2 px-4">
      <span className="min-w-0 flex-1 text-pretty text-[13px] font-extrabold leading-[1.3] text-sand-700 dark:text-zinc-400">{prompt}</span>
      {help && (
        <div className="flex shrink-0 gap-1.5">
          <Chip on={peek === "letters"} onClick={() => toggle("letters")}>
            Letters
          </Chip>
          <Chip on={peek === "whole"} onClick={() => toggle("whole")}>
            Verse
          </Chip>
          {skip && (
            <Chip on={false} muted onClick={skip}>
              Skip
            </Chip>
          )}
        </div>
      )}
    </div>
  );
}

interface ChipProps {
  on: boolean;
  muted?: boolean;
  onClick: () => void;
  children: string;
}

function Chip({ on, muted, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`whitespace-nowrap rounded-[11px] border-2 px-2.5 py-1.5 text-[10.5px] font-black uppercase tracking-[.04em] transition-transform active:translate-y-0.5 active:shadow-none ${
        on
          ? "border-ink bg-ink text-parchment shadow-[0_2px_0_#3F3A33] dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
          : `border-sand-300 bg-white shadow-[0_2px_0_#DCD3C4] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-none ${muted ? "text-sand-700 dark:text-zinc-400" : "text-ink dark:text-zinc-100"}`
      }`}
    >
      {children}
    </button>
  );
}
