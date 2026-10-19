"use client";

import type { VerseSegment } from "@/types";
import type { VerseStatus } from "@/lib/readerVerseStatus";
import { verseKey } from "@/lib/verseKey";
import { firstLettersOnly } from "@/lib/chapterPathPalette";
import { FIRST_LETTER_TEXT_SPACING_CLASS } from "@/lib/firstLetterGap";
import { HiddenWord } from "@/components/drills/HiddenWord";
import { NUMBER_CLASS } from "@/components/gamification/ReaderVerseRow";

interface ReaderProseRunProps {
  book: string;
  chapter: number;
  // Consecutive verses of one pericope, read as one paragraph.
  verses: VerseSegment[];
  statusOf: (verseNumber: number) => VerseStatus;
  isSelected: (verseNumber: number) => boolean;
  onTap: (verse: VerseSegment) => void;
  // While a lesson or review runs: whether held verses drop to first letters, which are blank
  // (grey pills) and which, already typed through, stay in full — as ReaderVerseRow.tsx does.
  duringLesson: boolean;
  isHidden: (verseNumber: number) => boolean;
  isRecalled: (verseNumber: number) => boolean;
}

// The chapter reader with sense lines off (lib/senseLineMode.ts): a pericope's verses as one
// continuous paragraph, each verse running on after the one before, a small number in its state's
// colours at its start. Tapping a verse selects it — tinted where it sits, nothing moving.
export function ReaderProseRun({ book, chapter, verses, statusOf, isSelected, onTap, duringLesson, isHidden, isRecalled }: ReaderProseRunProps) {
  return (
    <p className="px-3.5 py-2 text-[17px] font-medium leading-[1.9] text-sand-800 dark:text-zinc-300">
      {verses.map((verse) => {
        const status = statusOf(verse.verseNumber);
        const hidden = isHidden(verse.verseNumber);
        const lettersOnly = duringLesson && !hidden && !isRecalled(verse.verseNumber) && status !== "open" && status !== "current";
        const selected = isSelected(verse.verseNumber);
        return (
          <span
            key={verse.verseNumber}
            data-verse-key={verseKey(book, chapter, verse.verseNumber)}
            onClick={() => onTap(verse)}
            className={`cursor-pointer rounded-md [box-decoration-break:clone] ${selected ? "bg-sage-200/70 text-ink dark:bg-sage-900/50 dark:text-zinc-50" : ""} ${lettersOnly ? FIRST_LETTER_TEXT_SPACING_CLASS : ""}`}
          >
            <span className={`mr-1 inline-flex h-[20px] min-w-[20px] -translate-y-[1px] items-center justify-center rounded-full px-1 align-middle font-heading text-[10.5px] leading-none ${NUMBER_CLASS[status]}`}>
              {verse.verseNumber}
            </span>
            {hidden
              ? verse.text.split(/\s+/).map((word, index) => (
                  <span key={index}>
                    <HiddenWord word={word} />{" "}
                  </span>
                ))
              : `${lettersOnly ? firstLettersOnly(verse.text) : verse.text} `}
          </span>
        );
      })}
    </p>
  );
}
