"use client";

import { useEffect, type ReactNode } from "react";
import { BookOpen, CaseSensitive, Keyboard, Mic, SkipForward } from "lucide-react";
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
interface DrillHelpChipsProps {
  // In the reader's lesson top bar (PathLessonTopBar.tsx), at its right: small icon buttons (their
  // names as labels), and the tab opens below the whole bar, across its width.
  inBar?: boolean;
}

export function DrillHelpChips({ inBar = false }: DrillHelpChipsProps) {
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
    <div className={`flex shrink-0 justify-end gap-1.5 ${inBar ? "" : "relative px-4"}`}>
      {peek && verseText && (
        <div className={`absolute inset-x-3 z-10 ${inBar ? "top-[calc(100%+8px)]" : "bottom-[calc(100%+10px)]"} flex max-h-[50dvh] flex-col gap-1.5 overflow-y-auto rounded-[20px] border-2 border-sand-300 bg-white px-5 py-4 shadow-[0_4px_0_#DCD3C4] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-none`}>
          {parseToSenseLines(verseText).map((line, index) => (
            <p key={index} className="pl-5 -indent-5 text-[17px] font-semibold leading-[1.4] text-ink [word-spacing:.2em] dark:text-zinc-100">
              {peek === "letters" ? firstLettersDisplay(line) : line}
            </p>
          ))}
        </div>
      )}
      {inputSwap && (
        <Chip on={false} onClick={() => inputSwap.choose(inputSwap.to)} icon={inBar ? inputSwap.to === "type" ? <Keyboard size={16} strokeWidth={2.5} /> : <Mic size={16} strokeWidth={2.5} /> : undefined}>
          {inputSwap.to === "type" ? "Type instead" : "Speak instead"}
        </Chip>
      )}
      <Chip on={peek === "letters"} onClick={() => toggle("letters")} icon={inBar ? <CaseSensitive size={18} strokeWidth={2.5} /> : undefined}>
        Letters
      </Chip>
      <Chip on={peek === "whole"} onClick={() => toggle("whole")} icon={inBar ? <BookOpen size={16} strokeWidth={2.5} /> : undefined}>
        Verse
      </Chip>
      {skip && (
        <Chip on={false} muted onClick={skip} icon={inBar ? <SkipForward size={16} strokeWidth={2.5} /> : undefined}>
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
  // Shown in place of the name (which becomes its label) — the top bar's compact buttons.
  icon?: ReactNode;
  children: string;
}

function Chip({ on, muted, onClick, icon, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      aria-label={icon ? children : undefined}
      title={icon ? children : undefined}
      className={`flex items-center justify-center whitespace-nowrap rounded-[11px] border-2 ${icon ? "h-9 w-9" : "px-2.5 py-1.5"} text-[10.5px] font-black uppercase tracking-[.04em] transition-transform active:translate-y-0.5 active:shadow-none ${
        on
          ? "border-ink bg-ink text-parchment shadow-[0_2px_0_#3F3A33] dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
          : `border-sand-300 bg-white shadow-[0_2px_0_#DCD3C4] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-none ${muted ? "text-sand-700 dark:text-zinc-400" : "text-ink dark:text-zinc-100"}`
      }`}
    >
      {icon ?? children}
    </button>
  );
}
