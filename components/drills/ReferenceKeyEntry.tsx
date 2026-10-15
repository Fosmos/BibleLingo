"use client";

import { useEffect } from "react";
import { bookLetter, type ReferenceAnswer } from "@/lib/referenceAnswer";
import type { ReferenceEntry } from "@/lib/useReferenceEntry";
import { OnScreenKeyboard } from "@/components/ui/OnScreenKeyboard";
import { NumberKeyRow } from "@/components/ui/NumberKeyRow";

interface ReferenceKeyEntryProps {
  entry: ReferenceEntry;
  correct: ReferenceAnswer;
}

// The reference typed, like the first-letter stages: the book's first letter on the keyboard,
// then the chapter and verse on a number row that appears on top of it. A real keyboard works too.
export function ReferenceKeyEntry({ entry, correct }: ReferenceKeyEntryProps) {
  const numbers = entry.part === "chapter" || entry.part === "verse";
  const letter = (key: string) => {
    if (entry.part === "book") entry.answer("book", key.toLowerCase() === bookLetter(correct.book) ? correct.book : key);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (/^[0-9]$/.test(event.key)) entry.digit(event.key);
      else if (/^[a-z]$/i.test(event.key)) letter(event.key);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className="flex w-full flex-col gap-[5px] [.lesson-sheet-controls_&]:gap-2">
      {numbers && <NumberKeyRow onKey={entry.digit} />}
      <OnScreenKeyboard onKey={letter} disabled={entry.part !== "book"} />
    </div>
  );
}
