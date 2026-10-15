"use client";

import { bankChoices, type ReferenceAnswer } from "@/lib/referenceAnswer";
import type { ReferenceEntry } from "@/lib/useReferenceEntry";

interface ReferenceBankEntryProps {
  entry: ReferenceEntry;
  correct: ReferenceAnswer;
}

// The reference from a word bank, like Fill in the blank: the book from four, then the chapter
// from four, then the verse.
export function ReferenceBankEntry({ entry, correct }: ReferenceBankEntryProps) {
  if (!entry.part) return null;
  const part = entry.part;
  return (
    <div className={`grid w-full gap-2 ${part === "book" ? "grid-cols-2" : "grid-cols-4"}`}>
      {bankChoices(part, correct).map((choice) => (
        <button
          key={`${part}-${choice}`}
          type="button"
          onClick={() => entry.answer(part, choice)}
          className="press-5 rounded-2xl bg-white px-3 py-3 text-base font-extrabold text-ink shadow-[0_4px_0_#DCD3C4] dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-[0_4px_0_#3f3f46]"
        >
          {choice}
        </button>
      ))}
    </div>
  );
}
