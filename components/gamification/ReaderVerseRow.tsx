"use client";

import type { VerseSegment } from "@/types";
import type { VerseStatus } from "@/lib/readerVerseStatus";
import { parseToSenseLines } from "@/lib/senseLines";
import { SrsSeal } from "@/components/ui/SrsSeal";

interface ReaderVerseRowProps {
  // "Book|chapter|verse" — how the continuous reader finds and anchors rows across chapters.
  rowKey: string;
  verse: VerseSegment;
  status: VerseStatus;
  selected: boolean;
  onSelect: () => void;
  // Where this verse sits in a run of highlighted verses (a several-verse lesson), so the run
  // reads as one block: rounded only at its ends, one unbroken left bar.
  run?: "single" | "first" | "middle" | "last";
  // The verse's spaced-review seal (1–6, lib/srsSeals.ts), when it's in review.
  seal?: number | null;
}

const RUN_SHAPE = { single: "rounded-[20px]", first: "rounded-t-[20px]", middle: "rounded-none", last: "rounded-b-[20px]" };
const RUN_BAR = { single: "top-3 bottom-3", first: "top-3 bottom-0 rounded-b-none", middle: "top-0 bottom-0 rounded-none", last: "top-0 bottom-3 rounded-t-none" };

const NUMBER_CLASS: Record<VerseStatus, string> = {
  rooted: "bg-sage-700 text-white",
  due: "border-[3px] border-brand-500 bg-sage-700 text-white",
  growing: "bg-[color-mix(in_oklch,#3D472B_50%,#F0FAE1)] text-white",
  current: "border-[2.5px] border-dashed border-ink text-ink dark:border-zinc-100 dark:text-zinc-100",
  open: "border-2 border-sand-300 text-sand-700 dark:border-zinc-700 dark:text-zinc-400",
};

// One verse in the chapter reader (design_handoff_bible_progress): its number circle, coloured by
// state, beside its natural sense lines of about 4–6 words (lib/naturalSenseLines.ts).
// Selecting tints the row and adds a left bar without moving anything.
export function ReaderVerseRow({ rowKey, verse, status, selected, onSelect, run = "single", seal = null }: ReaderVerseRowProps) {
  const highlighted = selected;
  const lines = parseToSenseLines(verse.text);

  return (
    <div
      data-verse-key={rowKey}
      onClick={onSelect}
      className={`relative grid cursor-pointer grid-cols-[30px_minmax(0,1fr)] gap-3 px-3.5 py-2 ${highlighted ? RUN_SHAPE[run] : "rounded-[20px]"} ${highlighted ? "bg-sage-200/55 dark:bg-sage-900/40" : ""}`}
    >
      {highlighted && <span aria-hidden="true" className={`absolute left-1.5 w-[5px] rounded-full bg-sage-700 ${RUN_BAR[run]}`} />}
      <span className={`relative flex h-[30px] w-[30px] items-center justify-center rounded-full font-heading text-[13px] ${NUMBER_CLASS[status]}`}>
        {verse.verseNumber}
        {seal !== null && (
          <span className="absolute -bottom-1.5 -right-1.5">
            <SrsSeal tier={seal} size={16} />
          </span>
        )}
      </span>
      <div className={`flex min-w-0 flex-col gap-3 pt-[1px] text-[17px] font-medium leading-[1.5] ${selected ? "text-ink dark:text-zinc-50" : "text-sand-800 dark:text-zinc-300"}`}>
        {lines.map((line, index) => (
          <p key={index} className="pl-4 -indent-4">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
