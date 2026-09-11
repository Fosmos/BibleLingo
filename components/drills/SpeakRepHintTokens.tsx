"use client";

import { Fragment } from "react";
import type { FirstLetterHintToken } from "@/lib/verseFirstLetters";

interface SpeakRepHintTokensProps {
  tokens: FirstLetterHintToken[];
  openWordIndex: number | null;
  onToggleWord: (index: number) => void;
}

// SpeakRep.tsx's own first-letters-only hint display, split out purely to keep that file
// under this codebase's 200-line cap — tapping (or, on a mouse, hovering) a word's own
// letter reveals that one word (a touch device has no reliable hover state, so the reveal is
// click-driven, not CSS-hover-only; a mouse still gets the hover affordance for free via the
// same group/group-hover classes). Inline content only, no wrapping <p> — the caller decides
// whether that's its own standalone paragraph or one span inline within a bigger one (see
// LessonVerseContext.tsx, which flows the active verse inline alongside its own neighbors).
export function SpeakRepHintTokens({ tokens, openWordIndex, onToggleWord }: SpeakRepHintTokensProps) {
  return (
    <>
      {tokens.map((token, index) => (
        <Fragment key={index}>
          {token.fullWord ? (
            <span className="group relative inline-block">
              <button
                type="button"
                onClick={() => onToggleWord(index)}
                className="cursor-help border-b border-dotted border-line dark:border-zinc-600"
              >
                {token.display}
              </button>
              <span
                className={`pointer-events-none absolute left-1/2 top-full z-20 mt-1 w-max max-w-[12rem] -translate-x-1/2 rounded-lg border border-line bg-white px-2 py-1 text-xs font-normal normal-case tracking-normal text-ink-soft shadow-sm transition-opacity dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 ${
                  openWordIndex === index ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                {token.fullWord}
              </span>
            </span>
          ) : (
            token.display
          )}
          {token.spaceAfter && " "}
        </Fragment>
      ))}
    </>
  );
}
