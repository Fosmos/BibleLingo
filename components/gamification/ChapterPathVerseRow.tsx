"use client";

import type { VerseSegment } from "@/types";
import { parseToSenseLines } from "@/lib/senseLines";
import { FIRST_LETTER_TEXT_SPACING_CLASS } from "@/lib/firstLetterGap";
import { firstLettersOnly } from "@/lib/chapterPathPalette";
import { PathLessonVerseSlot } from "@/components/gamification/PathLessonVerseSlot";
import { ChapterPathVerseNode, type VerseStatus } from "@/components/gamification/ChapterPathVerseNode";

export type { VerseStatus } from "@/components/gamification/ChapterPathVerseNode";

interface ChapterPathVerseRowProps {
  verse: VerseSegment;
  index: number;
  status: VerseStatus;
  selected: boolean;
  // The selected verse's pericope reads in full ink; the others are a step softer.
  inSelectedPericope: boolean;
  onSelect: () => void;
  onAction: () => void;
  // An open verse picked to learn (shelf_path's "chosen"); `onChoose` toggles it from its card.
  chosen?: boolean;
  onChoose?: () => void;
  // A lesson is running on this verse: its card holds the lesson's verse zone in place of the text.
  hostsLesson?: boolean;
  // A lesson is running somewhere in the chapter: growing verses drop to first letters too, so a
  // warm-up over the verses before it isn't answered on the page.
  duringLesson?: boolean;
  // Mid-review, a verse still ahead of the reader: its node stays on the road, its text is left empty.
  hidden?: boolean;
}

// The verse's text column — raised onto a card when selected (and while a lesson runs on it).
const CARD_CLASS = "relative z-[2] flex min-w-0 flex-1 flex-col gap-1.5 rounded-[14px] px-1.5 py-1";
const SELECTED_CARD_CLASS = "bg-paper shadow-organic-md dark:bg-zinc-950";
const DUE_CARD_CLASS = "border-2 border-brand-300 bg-paper dark:border-brand-700 dark:bg-zinc-950";

const ACTION_WORD: Record<VerseStatus, string> = { due: "Review", rooted: "Practise", growing: "Practise", current: "Learn", open: "Preview" };
const KICKER: Partial<Record<VerseStatus, string>> = { due: "Needs review · tap to review", growing: "Growing" };

// One verse on the Chapter Path View: its node on the road beside its sense lines — first letters
// only while rooted or due, unless selected. The selected verse lifts onto a card with its
// Review / Practise / Learn / Preview button (and Choose, for a verse not started).
export function ChapterPathVerseRow({ verse, index, status, selected, inSelectedPericope, onSelect, onAction, chosen = false, onChoose, hostsLesson, duringLesson, hidden }: ChapterPathVerseRowProps) {
  const lettersOnly = (status === "rooted" || status === "due" || (status === "growing" && duringLesson)) && !selected;
  const lines = parseToSenseLines(verse.text).map((line) => (lettersOnly ? firstLettersOnly(line) : line));
  const node = <ChapterPathVerseNode verseNumber={verse.verseNumber} index={index} status={status} selected={selected} chosen={chosen} onSelect={onSelect} />;

  // A lesson running on this verse: its raised card itself becomes the lesson's verse zone.
  if (hostsLesson) {
    return (
      <div data-verse={verse.verseNumber} className="relative flex py-1.5 pr-1.5">
        {node}
        <PathLessonVerseSlot className={`${CARD_CLASS} ${SELECTED_CARD_CLASS}`} />
      </div>
    );
  }

  if (hidden) {
    return (
      <div data-verse={verse.verseNumber} className="relative flex py-1.5 pr-1.5">
        {node}
        <div className={CARD_CLASS} aria-hidden="true" />
      </div>
    );
  }

  const kicker = selected ? undefined : KICKER[status];
  const button = "self-start rounded-full px-4 py-[9px] text-[13px] font-bold";
  return (
    <div data-verse={verse.verseNumber} onClick={onSelect} className="relative flex cursor-pointer py-1.5 pr-1.5">
      {node}
      <div className={`${CARD_CLASS} ${selected ? SELECTED_CARD_CLASS : status === "due" ? `${DUE_CARD_CLASS} px-2.5 py-2` : ""}`}>
        {kicker && (
          <span className={`text-[11px] font-extrabold uppercase tracking-[.06em] ${status === "due" ? "text-brand-700 dark:text-brand-300" : "text-sage-700 dark:text-sage-300"}`}>{kicker}</span>
        )}
        <div className={`flex flex-col ${lettersOnly ? FIRST_LETTER_TEXT_SPACING_CLASS : ""}`}>
          {lines.map((line, lineIndex) => (
            <p
              key={lineIndex}
              className={`pl-6 -indent-6 text-[15px] leading-[1.42] ${selected ? "font-bold" : "font-medium"} ${
                selected || inSelectedPericope ? "text-ink dark:text-zinc-100" : "text-ink-soft dark:text-zinc-300"
              }`}
            >
              {line}
            </p>
          ))}
        </div>
        {selected && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onAction();
              }}
              className={`${button} bg-brand-500 text-paper hover:bg-brand-600 active:bg-brand-700`}
            >
              {ACTION_WORD[status]} {verse.chapter}:{verse.verseNumber}
            </button>
            {status === "open" && onChoose && (
              <button
                type="button"
                aria-pressed={chosen}
                onClick={(event) => {
                  event.stopPropagation();
                  onChoose();
                }}
                className={`${button} ${chosen ? "bg-ink text-paper dark:bg-zinc-100 dark:text-zinc-900" : "bg-sand-200 text-ink hover:bg-sand-300 dark:bg-zinc-800 dark:text-zinc-100"}`}
              >
                {chosen ? "Chosen ✓" : "Choose"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
