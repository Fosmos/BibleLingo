"use client";

import type { VerseSegment } from "@/types";
import type { VerseStatus } from "@/lib/readerVerseStatus";
import { verseKey } from "@/lib/verseKey";
import { joinStrayPunctuation } from "@/lib/verseWords";
import { HiddenWord } from "@/components/drills/HiddenWord";
import { HeldVerseWords } from "@/components/gamification/HeldVerseWords";
import { PathLessonVerseSlot } from "@/components/gamification/PathLessonVerseSlot";

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
  // The verse a lesson runs on, if it's here: its words become the lesson's, right where they sit.
  lessonVerse: number | null;
}

// The chapter reader with sense lines off (lib/senseLineMode.ts): a pericope's verses as one
// continuous paragraph, each verse running on after the one before, a small number at its start. Tapping a verse selects it — tinted where it sits, nothing moving (the tint
// reaches above and below the line with vertical padding, which an inline span adds without
// moving any line — taller than the pills a lesson puts there). A
// lesson's verse stays in the paragraph too: its words become the stage's (an inline verse zone,
// PathLessonVerseSlot.tsx), highlighted over just that verse, even when it starts mid-line.
export function ReaderProseRun({ book, chapter, verses, statusOf, isSelected, onTap, duringLesson, isHidden, isRecalled, lessonVerse }: ReaderProseRunProps) {
  return (
    <p className="px-3.5 py-2 text-[17px] font-medium leading-[1.9] text-sand-800 dark:text-zinc-300">
      {verses.map((verse) => {
        const status = statusOf(verse.verseNumber);
        const hidden = isHidden(verse.verseNumber);
        const lettersOnly = duringLesson && !hidden && !isRecalled(verse.verseNumber) && status !== "open" && status !== "current";
        const hosts = verse.verseNumber === lessonVerse;
        const text = joinStrayPunctuation(verse.text);
        const selected = hosts || isSelected(verse.verseNumber);
        return (
          <span
            key={verse.verseNumber}
            data-verse-key={verseKey(book, chapter, verse.verseNumber)}
            onClick={hosts ? undefined : () => onTap(verse)}
            className={`cursor-pointer rounded-md [box-decoration-break:clone] ${selected ? "bg-white py-[0.3em] text-ink dark:bg-zinc-800 dark:text-zinc-50" : ""}`}
          >
            <span className="mr-1 align-middle text-[11px] font-extrabold leading-none text-sand-700 dark:text-zinc-400">
              {verse.verseNumber}
            </span>
            {hosts && <PathLessonVerseSlot inline />}
            {!hosts &&
              hidden &&
              text.split(/\s+/).map((word, index) => (
                <span key={index}>
                  <HiddenWord word={word} />{" "}
                </span>
              ))}
            {!hosts && !hidden && lettersOnly && (
              <>
                <HeldVerseWords text={text} />{" "}
              </>
            )}
            {!hosts && !hidden && !lettersOnly && `${text} `}
          </span>
        );
      })}
    </p>
  );
}
