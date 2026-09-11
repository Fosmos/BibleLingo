"use client";

import type { ReactNode } from "react";
import type { VerseSegment } from "@/types";
import type { FirstLetterHintToken } from "@/lib/verseFirstLetters";
import { VerseContextLine } from "@/components/ui/VerseContextLine";
import { SpeakRepHintTokens } from "@/components/drills/SpeakRepHintTokens";

interface SpeakRepPlainContextProps {
  previousVerse?: VerseSegment;
  nextVerse?: VerseSegment;
  showVerse?: boolean;
  targetText: string;
  hintTokens?: FirstLetterHintToken[];
  openWordIndex: number | null;
  onToggleWord: (index: number) => void;
}

// SpeakRep.tsx's own pre-LessonVerseContext fallback — every caller that doesn't pass a
// `verse`/`contextVerses` pair (every one but the Learn flow's speak_hint stage) still gets
// this original plain previousVerse/nextVerse single-line treatment. Split out purely to keep
// SpeakRep.tsx under this codebase's 200-line cap.
export function SpeakRepPlainContext({
  previousVerse,
  nextVerse,
  showVerse,
  targetText,
  hintTokens,
  openWordIndex,
  onToggleWord,
}: SpeakRepPlainContextProps): ReactNode {
  return (
    <>
      {previousVerse && <VerseContextLine verse={previousVerse} />}
      {showVerse && <p className="text-lg leading-relaxed">{targetText}</p>}
      {!showVerse && hintTokens && hintTokens.length > 0 && (
        <p className="text-lg leading-relaxed tracking-widest text-ink-soft dark:text-zinc-300">
          <SpeakRepHintTokens tokens={hintTokens} openWordIndex={openWordIndex} onToggleWord={onToggleWord} />
        </p>
      )}
      {nextVerse && <VerseContextLine verse={nextVerse} />}
    </>
  );
}
