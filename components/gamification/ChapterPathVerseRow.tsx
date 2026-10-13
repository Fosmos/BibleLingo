"use client";

import type { VerseSegment } from "@/types";
import { parseToSenseLines } from "@/lib/senseLines";
import { FIRST_LETTER_TEXT_SPACING_CLASS } from "@/lib/firstLetterGap";
import { firstLettersOnly } from "@/lib/chapterPathPalette";
import { fitSenseLines } from "@/lib/fitSenseLines";
import { useLineFit } from "@/lib/useLineFit";
import { PathLessonVerseSlot } from "@/components/gamification/PathLessonVerseSlot";
import { ChapterPathVerseNode, type VerseStatus } from "@/components/gamification/ChapterPathVerseNode";

export type { VerseStatus } from "@/components/gamification/ChapterPathVerseNode";

interface ChapterPathVerseRowProps {
  verse: VerseSegment;
  status: VerseStatus;
  selected: boolean;
  // The selected verse's pericope reads in full ink; the others are a step softer.
  inSelectedPericope: boolean;
  onSelect: () => void;
  // An open verse picked to learn (shelf_path's "chosen").
  chosen?: boolean;
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
// Rows sit flush; the road's gap between verses (PericopeTrailCard.tsx) matches the gap between
// sense lines, so a chapter reads as one continuous text.
const ROW_CLASS = "relative flex pr-1.5";
const SELECTED_CARD_CLASS = "bg-paper shadow-organic-md dark:bg-zinc-950";
// A ring, not a border, so a due verse's text sits exactly where it would otherwise.
const DUE_CARD_CLASS = "bg-paper ring-2 ring-inset ring-brand-300 dark:bg-zinc-950 dark:ring-brand-700";

const KICKER: Partial<Record<VerseStatus, string>> = { due: "Needs review · tap to review", growing: "Growing" };

// One verse on the Chapter Path View: its node on the road beside its sense lines — first letters
// only while rooted or due, unless selected. The selected verse lifts onto a card; its Learn /
// Review / Preview button sits in the chapter's bottom bar (ChapterActionBar.tsx), not in the text.
export function ChapterPathVerseRow({ verse, status, selected, inSelectedPericope, onSelect, chosen = false, hostsLesson, duringLesson, hidden }: ChapterPathVerseRowProps) {
  const lettersOnly = (status === "rooted" || status === "due" || (status === "growing" && duringLesson)) && !selected;
  // One fixed size; a sense line too long for the column splits rather than shrinking or wrapping.
  const [textRef, measure, width] = useLineFit<HTMLDivElement>();
  const lines = fitSenseLines(parseToSenseLines(verse.text), measure, width).map((line) => (lettersOnly ? firstLettersOnly(line) : line));
  const node = <ChapterPathVerseNode verseNumber={verse.verseNumber} status={status} selected={selected} chosen={chosen} onSelect={onSelect} />;

  // A lesson running on this verse: its raised card itself becomes the lesson's verse zone.
  if (hostsLesson) {
    return (
      <div data-verse={verse.verseNumber} className={ROW_CLASS}>
        {node}
        <PathLessonVerseSlot className={`${CARD_CLASS} ${SELECTED_CARD_CLASS}`} />
      </div>
    );
  }

  if (hidden) {
    return (
      <div data-verse={verse.verseNumber} className={ROW_CLASS}>
        {node}
        <div className={CARD_CLASS} aria-hidden="true" />
      </div>
    );
  }

  const kicker = selected ? undefined : KICKER[status];
  return (
    <div data-verse={verse.verseNumber} onClick={onSelect} className={`${ROW_CLASS} cursor-pointer`}>
      {node}
      <div className={`${CARD_CLASS} ${selected ? SELECTED_CARD_CLASS : status === "due" ? DUE_CARD_CLASS : ""}`}>
        {kicker && (
          <span className={`text-[11px] font-extrabold uppercase tracking-[.06em] ${status === "due" ? "text-brand-700 dark:text-brand-300" : "text-sage-700 dark:text-sage-300"}`}>{kicker}</span>
        )}
        <div
          ref={textRef}
          className={`flex flex-col gap-3 text-[17px] font-medium leading-[1.5] ${lettersOnly ? FIRST_LETTER_TEXT_SPACING_CLASS : ""}`}
        >
          {lines.map((line, lineIndex) => (
            <p
              key={lineIndex}
              className={`pl-4 -indent-4 ${
                selected || inSelectedPericope ? "text-ink dark:text-zinc-100" : "text-ink-soft dark:text-zinc-300"
              }`}
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
