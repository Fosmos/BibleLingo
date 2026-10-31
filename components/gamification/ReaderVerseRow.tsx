"use client";

import type { VerseSegment } from "@/types";
import { parseToSenseLines } from "@/lib/senseLines";
import { joinStrayPunctuation } from "@/lib/verseWords";
import { PathLessonVerseSlot } from "@/components/gamification/PathLessonVerseSlot";
import { HiddenWord } from "@/components/drills/HiddenWord";
import { HeldVerseWords } from "@/components/gamification/HeldVerseWords";

interface ReaderVerseRowProps {
  // "Book|chapter|verse" — how the continuous reader finds and anchors rows across chapters.
  rowKey: string;
  verse: VerseSegment;
  selected: boolean;
  onSelect: () => void;
  // A lesson runs on this verse: the text column becomes the lesson's verse zone.
  hostsLesson: boolean;
  // A lesson runs somewhere in the chapter: held verses drop to first letters (no answers on the page).
  duringLesson: boolean;
  // Mid-lesson or review, a verse not reached yet (or in the review's range): grey pills, one a word.
  hidden: boolean;
  // Already typed or said through in this lesson or review: stays in full, not first letters.
  recalled: boolean;
  // Learned already: during a lesson it drops to first letters.
  held: boolean;
  // Where this verse sits in a run of highlighted verses (a several-verse lesson), so the run
  // reads as one block: rounded only at its ends, one unbroken left bar.
  run?: "single" | "first" | "middle" | "last";
}

const RUN_SHAPE = { single: "rounded-[20px]", first: "rounded-t-[20px]", middle: "rounded-none", last: "rounded-b-[20px]" };

// One verse in the chapter reader: its reference in the margin beside its natural sense lines of about
// 5–8 words (lib/naturalSenseLines.ts), the same with or without a lesson running, so nothing moves.
// Selecting raises the row as a white card, as a lesson does, without moving anything. A lesson or review runs in
// its verse's own row, raised as a card with its reference in the margin (PathLessonVerseSlot.tsx),
// the controls docked below (PathLessonDock.tsx); its neighbours show quieter around it.
export function ReaderVerseRow({ rowKey, verse, selected, onSelect, hostsLesson, duringLesson, hidden, recalled, held, run = "single" }: ReaderVerseRowProps) {
  const lettersOnly = duringLesson && !recalled && !hidden && held;
  // The selected verse — and the verse a lesson or review is running on — carries the highlight.
  const highlighted = !duringLesson && selected;
  const lines = parseToSenseLines(joinStrayPunctuation(verse.text));

  return (
    <div
      data-verse-key={rowKey}
      onClick={duringLesson ? undefined : onSelect}
      className={`relative grid grid-cols-[38px_minmax(0,1fr)] gap-2 ${duringLesson ? "" : "cursor-pointer"} ${hostsLesson ? "-mx-1 my-1 rounded-[24px] bg-white px-3 py-5 shadow-[0_6px_20px_rgba(32,30,29,0.14)] dark:bg-zinc-800" : "px-3.5 py-2"} ${!hostsLesson && (highlighted ? RUN_SHAPE[run] : "rounded-[20px]")} ${highlighted ? "bg-white shadow-[0_6px_20px_rgba(32,30,29,0.14)] dark:bg-zinc-800" : ""}`}
    >
      {/* Blank while the reference itself is being recalled (data-ref-slot, PathLessonTopBar.tsx). */}
      <span className={`[body:has([data-ref-slot]:not(:empty))_&]:invisible ${hostsLesson ? "font-heading text-[17px] leading-[1.5] text-brand-800 dark:text-brand-300" : "pt-[1px] text-sm font-extrabold leading-[1.5] text-sand-700 dark:text-zinc-400"}`}>
        {verse.chapter}:{verse.verseNumber}
      </span>
      {hostsLesson ? (
        <PathLessonVerseSlot className="relative z-[2] min-w-0 pt-[1px] text-[17px] leading-[1.5]" />
      ) : (
        <div
          aria-hidden={hidden || undefined}
          className={`flex min-w-0 flex-col pt-[1px] font-medium gap-1 text-[15px] leading-[1.4] ${selected ? "text-ink dark:text-zinc-50" : "text-sand-700 dark:text-zinc-400"}`}
        >
          {lines.map((line, index) => (
            // The lesson's verse zone lays its lines out the same way (SenseLineRow.tsx), so nothing moves.
            <p key={index} className="pl-5 -indent-5 text-pretty">
              {/* A blanked verse keeps its lines, each word a grey pill its length (HiddenWord.tsx). */}
              {hidden
                ? line.split(" ").map((word, wordIndex) => (
                    <span key={wordIndex}>
                      <HiddenWord word={word} />{" "}
                    </span>
                  ))
                : lettersOnly
                  ? <HeldVerseWords text={line} />
                  : line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
