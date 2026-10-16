"use client";

import { useEffect } from "react";
import { bookLetter, type ReferenceAnswer } from "@/lib/referenceAnswer";
import type { ReferenceEntry } from "@/lib/useReferenceEntry";
import { OnScreenKeyboard } from "@/components/ui/OnScreenKeyboard";

interface ReferenceKeyEntryProps {
  entry: ReferenceEntry;
  correct: ReferenceAnswer;
}

// The reference typed, like the first-letter stages: a numbered book's number, the book's first
// letter, then the chapter and verse — on the keyboard's own number row and letters. A real
// keyboard works too.
export function ReferenceKeyEntry({ entry, correct }: ReferenceKeyEntryProps) {
  const letter = (key: string) => {
    if (/^[0-9]$/.test(key)) entry.digit(key);
    else if (entry.part === "book") entry.answer("book", key.toLowerCase() === bookLetter(correct.book) ? correct.book : key);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (/^[0-9a-z]$/i.test(event.key)) letter(event.key);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <OnScreenKeyboard onKey={letter} />
  );
}
