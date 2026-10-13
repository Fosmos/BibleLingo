"use client";

import type { VerseSegment } from "@/types";
import type { VerseStatus } from "@/lib/readerVerseStatus";
import { parseToSenseLines } from "@/lib/senseLines";
import { fitSenseLines } from "@/lib/fitSenseLines";
import { useLineFit } from "@/lib/useLineFit";
import { firstLettersOnly } from "@/lib/chapterPathPalette";
import { FIRST_LETTER_TEXT_SPACING_CLASS } from "@/lib/firstLetterGap";
import { PathLessonVerseSlot } from "@/components/gamification/PathLessonVerseSlot";

interface ReaderVerseRowProps {
  verse: VerseSegment;
  status: VerseStatus;
  selected: boolean;
  onSelect: () => void;
  // A lesson runs on this verse: the text column becomes the lesson's verse zone.
  hostsLesson: boolean;
  // A lesson runs somewhere in the chapter: held verses drop to first letters (no answers on the page).
  duringLesson: boolean;
  // Mid-lesson or review, a verse not reached yet (or in the review's range): left blank.
  hidden: boolean;
}

const NUMBER_CLASS: Record<VerseStatus, string> = {
  rooted: "bg-sage-700 text-white",
  due: "border-[3px] border-brand-500 bg-sage-700 text-white",
  growing: "bg-[color-mix(in_oklch,#3D472B_50%,#F0FAE1)] text-white",
  current: "border-[2.5px] border-dashed border-ink text-ink dark:border-zinc-100 dark:text-zinc-100",
  open: "border-2 border-sand-300 text-sand-700 dark:border-zinc-700 dark:text-zinc-400",
};

// One verse in the chapter reader (design_handoff_bible_progress): its number circle, coloured by
// state, beside its sense lines — fitted to the column at one fixed size (lib/fitSenseLines.ts).
// Selecting tints the row and adds a left bar without moving anything.
export function ReaderVerseRow({ verse, status, selected, onSelect, hostsLesson, duringLesson, hidden }: ReaderVerseRowProps) {
  const [textRef, measure, width] = useLineFit<HTMLDivElement>();
  const lettersOnly = duringLesson && status !== "open" && status !== "current";
  const lines = fitSenseLines(parseToSenseLines(verse.text), measure, width).map((line) => (lettersOnly ? firstLettersOnly(line) : line));

  return (
    <div
      data-verse={verse.verseNumber}
      onClick={hostsLesson ? undefined : onSelect}
      className={`relative grid cursor-pointer grid-cols-[30px_minmax(0,1fr)] gap-3 rounded-[20px] px-3.5 py-2 ${selected && !hostsLesson ? "bg-sage-200/55 dark:bg-sage-900/40" : ""}`}
    >
      {selected && !hostsLesson && <span aria-hidden="true" className="absolute bottom-3 left-1.5 top-3 w-[5px] rounded-full bg-sage-700" />}
      <span className={`flex h-[30px] w-[30px] items-center justify-center rounded-full font-heading text-[13px] ${NUMBER_CLASS[status]}`}>{verse.verseNumber}</span>
      {hostsLesson ? (
        <PathLessonVerseSlot className="relative z-[2] flex min-w-0 flex-col gap-1.5 rounded-[14px] bg-paper px-1.5 py-1 shadow-organic-md dark:bg-zinc-950" />
      ) : (
        <div
          ref={textRef}
          aria-hidden={hidden || undefined}
          className={`flex min-w-0 flex-col gap-3 pt-[1px] text-[17px] font-medium leading-[1.5] ${selected ? "text-ink dark:text-zinc-50" : "text-sand-800 dark:text-zinc-300"} ${lettersOnly ? FIRST_LETTER_TEXT_SPACING_CLASS : ""}`}
        >
          {!hidden &&
            lines.map((line, index) => (
              <p key={index} className="pl-4 -indent-4">
                {line}
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
