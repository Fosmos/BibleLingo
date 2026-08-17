"use client";

import { useState } from "react";
import { playCorrectSfx, playIncorrectSfx } from "@/lib/audio";

interface ReferenceNumberEntryProps {
  chapter: string;
  verse: string;
  onDone: () => void;
  onMistake?: () => void;
}

type Phase = "chapter" | "verse";

// When verse references are enabled, a reference token like "3:16" is tokenized as a
// single word elsewhere in the app — but typing just its first letter ("3") would prove
// the user knows the chapter digit and nothing about the verse digit(s). This asks for the
// full chapter number, then the full verse number, one after another in a single box (the
// chapter locks in and a ":" appears once it's correct, then further digits are checked
// against the verse) — so finishing the chapter can never also satisfy the verse.
export function ReferenceNumberEntry({ chapter, verse, onDone, onMistake }: ReferenceNumberEntryProps) {
  const [phase, setPhase] = useState<Phase>("chapter");
  const [chapterValue, setChapterValue] = useState("");
  const [verseValue, setVerseValue] = useState("");
  const [error, setError] = useState(false);

  const prefix = `${chapter}:`;
  const displayValue = phase === "chapter" ? chapterValue : `${prefix}${verseValue}`;

  function handleChapterInput(digitsOnly: string) {
    if (digitsOnly.length === 0) {
      setChapterValue("");
      setError(false);
      return;
    }
    if (!chapter.startsWith(digitsOnly)) {
      playIncorrectSfx();
      setError(true);
      setChapterValue("");
      onMistake?.();
      return;
    }
    setError(false);
    setChapterValue(digitsOnly);
    if (digitsOnly === chapter) {
      playCorrectSfx();
      setPhase("verse");
    }
  }

  function handleVerseInput(digitsOnly: string) {
    if (digitsOnly.length === 0) {
      setVerseValue("");
      setError(false);
      return;
    }
    if (!verse.startsWith(digitsOnly)) {
      playIncorrectSfx();
      setError(true);
      setVerseValue("");
      onMistake?.();
      return;
    }
    setError(false);
    setVerseValue(digitsOnly);
    if (digitsOnly === verse) {
      playCorrectSfx();
      onDone();
    }
  }

  function handleChange(raw: string) {
    if (phase === "chapter") {
      handleChapterInput(raw.replace(/\D/g, ""));
      return;
    }
    if (raw.length === 0) {
      setPhase("chapter");
      setChapterValue("");
      setVerseValue("");
      setError(false);
      return;
    }
    if (!raw.startsWith(prefix)) return;
    handleVerseInput(raw.slice(prefix.length).replace(/\D/g, ""));
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-ink-muted">Type the chapter, then the verse number</p>
      <input
        value={displayValue}
        onChange={(event) => handleChange(event.target.value)}
        inputMode="numeric"
        autoComplete="off"
        autoFocus
        aria-label="Type the chapter number, then the verse number"
        className={`w-28 rounded-xl border p-3 text-center text-xl focus:outline-none focus-visible:ring-2 dark:bg-zinc-900 ${
          error ? "border-heart-500 focus-visible:ring-heart-500" : "border-line focus-visible:ring-brand-500 dark:border-zinc-700"
        }`}
      />
      {error && <p className="text-sm font-medium text-heart-600">Not quite — try again.</p>}
    </div>
  );
}
