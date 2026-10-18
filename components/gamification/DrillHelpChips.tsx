"use client";

import { useEffect } from "react";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { stageHasHelp } from "@/lib/lessonPrompts";
import { parseToSenseLines } from "@/lib/senseLines";
import { firstLettersDisplay } from "@/lib/verseFirstLetters";
import type { Peek } from "@/lib/peek";

// The lesson page tray's first row (design_handoff_lesson_view): three chips at the right —
// Letters and Verse open a tab over the lesson with the verse in its sense lines, as just its
// first letters or in full (one at a time; tap again to close, and it closes when the stage
// changes), and Skip moves past the stage (its testing shortcut, AutoCompleteButton.tsx). On a
// drill said aloud or typed by first letter, "Speak instead" / "Type instead" first switches the
// rest of the lesson's such drills to the other way (lib/useInputSwap.ts). No
// chips on Listen and Pray.
export function DrillHelpChips() {
  const stage = useLessonSessionStore((state) => state.sheetStage);
  const peek = useLessonSessionStore((state) => state.peek);
  const setPeek = useLessonSessionStore((state) => state.setPeek);
  const skip = useLessonSessionStore((state) => state.skipStage);
  const verseText = useLessonSessionStore((state) => state.helpVerseText);
  const inputSwap = useLessonSessionStore((state) => state.inputSwap);
  const stageKey = stage ? `${stage.label}|${stage.reference}|${stage.step}` : "";

  // A new stage (or a new step within one, which brings its own Skip) starts with the tab shut.
  useEffect(() => {
    setPeek(null);
  }, [stageKey, skip, setPeek]);
  useEffect(() => () => setPeek(null), [setPeek]);

  if (!stageHasHelp(stage?.label)) return null;
  const toggle = (kind: Exclude<Peek, null>) => setPeek(peek === kind ? null : kind);

  return (
    <div className="relative flex justify-end gap-1.5 px-4">
      {peek && verseText && (
        <div className="absolute inset-x-3 bottom-[calc(100%+10px)] z-10 flex max-h-[50dvh] flex-col gap-1.5 overflow-y-auto rounded-[20px] border-2 border-sand-300 bg-white px-5 py-4 shadow-[0_4px_0_#DCD3C4] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-none">
          {parseToSenseLines(verseText).map((line, index) => (
            <p key={index} className="pl-5 -indent-5 text-[17px] font-semibold leading-[1.4] text-ink [word-spacing:.2em] dark:text-zinc-100">
              {peek === "letters" ? firstLettersDisplay(line) : line}
            </p>
          ))}
        </div>
      )}
      {inputSwap && (
        <Chip on={false} onClick={() => inputSwap.choose(inputSwap.to)}>
          {inputSwap.to === "type" ? "Type instead" : "Speak instead"}
        </Chip>
      )}
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
