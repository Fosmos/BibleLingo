"use client";

import { useState, type KeyboardEvent } from "react";
import type { VerseSegment } from "@/types";
import { playCorrectSfx, playIncorrectSfx } from "@/lib/audio";
import { tokenizeVerseWords, firstWordCharacter } from "@/lib/verseWords";
import { ReferenceNumberEntry } from "@/components/drills/ReferenceNumberEntry";
import { WordRevealLine } from "@/components/drills/WordRevealLine";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { LessonPageCard } from "@/components/gamification/LessonPageCard";
import { LessonControlBar } from "@/components/gamification/LessonControlBar";

interface WordTypeEntryProps {
  verse: VerseSegment;
  // "fullWord" (Boss Battle, Practice) requires typing every word out in full; "firstLetter"
  // (the chapter boss battle) only requires each word's first letter, the same
  // reveal-on-correct-letter mechanic FirstLetterTypeRep uses — the full word still lands on
  // the real page either way (see WordRevealLine.tsx), so the growing recited text always
  // reads in full.
  mode: "fullWord" | "firstLetter";
  onComplete: (hadMistake: boolean) => void;
  onMistake?: () => void;
  // The reading view's own real page layout (see lib/useChapterReadingLayout.ts) — every
  // caller sets this (Boss Battle/Practice both drill against a real chapter's own verses),
  // so the verse renders on the SAME real reading-view page/size/position as browsing.
  layout: ChapterReadingLayout;
}

const REFERENCE_PATTERN = /^(\d+):(\d+)$/;

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^\w]/g, "");
}

// One verse, revealed word by word — the shared mechanic behind both the Boss Battle
// (paired with a life-loss counter via onMistake) and Practice (paired with a per-verse
// redo prompt via the hadMistake flag onComplete reports). A wrong word/letter doesn't
// advance, so getting it right is still required to move on — onMistake just lets the caller
// react to the miss in real time.
export function WordTypeEntry({ verse, mode, onComplete, onMistake, layout }: WordTypeEntryProps) {
  const words = tokenizeVerseWords(verse.text);
  const [wordIndex, setWordIndex] = useState(0);
  const [revealedWords, setRevealedWords] = useState<string[]>([]);
  const [value, setValue] = useState("");
  const [showError, setShowError] = useState(false);
  const [hadMistake, setHadMistake] = useState(false);

  const currentWord = words[wordIndex];
  const referenceMatch = currentWord?.match(REFERENCE_PATTERN);

  function revealCurrentWord(missed: boolean) {
    const stillMissed = hadMistake || missed;
    setShowError(false);
    setValue("");
    const nextRevealed = [...revealedWords, currentWord];
    setRevealedWords(nextRevealed);
    const next = wordIndex + 1;
    if (next >= words.length) {
      onComplete(stillMissed);
    } else {
      setWordIndex(next);
      setHadMistake(stillMissed);
    }
  }

  function submitWord() {
    if (normalizeWord(value) === normalizeWord(currentWord)) {
      playCorrectSfx();
      revealCurrentWord(false);
    } else if (value.trim()) {
      playIncorrectSfx();
      setShowError(true);
      setValue("");
      setHadMistake(true);
      onMistake?.();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      submitWord();
    }
  }

  function handleLetterChange(inputValue: string) {
    if (!currentWord) return;
    const expected = firstWordCharacter(currentWord)?.toLowerCase();
    const typed = inputValue.toLowerCase();

    if (typed && typed === expected) {
      playCorrectSfx();
      revealCurrentWord(false);
    } else if (typed) {
      playIncorrectSfx();
      setShowError(true);
      setValue("");
      setHadMistake(true);
      onMistake?.();
    }
  }

  if (!currentWord) return null;

  return (
    <div className="flex flex-col gap-3">
      <LessonPageCard
        layout={layout}
        activeVerse={verse}
        renderActiveVerse={() => <WordRevealLine words={words} revealedCount={revealedWords.length} />}
      />

      <LessonControlBar dockRef={layout.dockRef}>
        {referenceMatch ? (
          <ReferenceNumberEntry
            key={`${verse.id}-${wordIndex}`}
            chapter={referenceMatch[1]}
            verse={referenceMatch[2]}
            onDone={() => revealCurrentWord(false)}
            onMistake={() => {
              setHadMistake(true);
              onMistake?.();
            }}
          />
        ) : mode === "firstLetter" ? (
          <input
            value={value}
            onChange={(event) => handleLetterChange(event.target.value)}
            maxLength={1}
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Type the first letter of the next word"
            className={`w-16 rounded-xl border p-3 text-center text-xl focus:outline-none focus-visible:ring-2 dark:bg-zinc-900 ${
              showError
                ? "border-heart-500 focus-visible:ring-heart-500"
                : "border-line focus-visible:ring-brand-500 dark:border-zinc-700"
            }`}
          />
        ) : (
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Type the word, then press space"
            aria-label="Type the next word"
            className={`w-full max-w-xs rounded-xl border p-3 text-lg focus:outline-none focus-visible:ring-2 dark:bg-zinc-900 ${
              showError
                ? "border-heart-500 focus-visible:ring-heart-500"
                : "border-line focus-visible:ring-brand-500 dark:border-zinc-700"
            }`}
          />
        )}
        <AutoCompleteButton onClick={() => onComplete(hadMistake)} />
      </LessonControlBar>
    </div>
  );
}
