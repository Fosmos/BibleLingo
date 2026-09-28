"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { VerseSegment } from "@/types";
import { firstWordCharacter, hiddenWordBlank, wordLetterPlaceholder } from "@/lib/verseWords";
import { buildDrawTokens, bucketTokenIndicesByClause, nextWordTokenIndex, withOwnPunctuation } from "@/lib/verseDrawTokens";
import { senseLineWordRanges, type SenseLineWordRange } from "@/lib/senseLineWordRanges";
import { FIRST_LETTER_GAP_CLASS } from "@/lib/firstLetterGap";
import { useDrawingCanvas } from "@/lib/useDrawingCanvas";
import { useAutoRecognizeDraw } from "@/lib/useAutoRecognizeDraw";
import { TAP_SCALE } from "@/lib/motionTokens";
import type { WordAnnotationMap } from "@/lib/verseHighlights";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { LessonControlBar } from "@/components/gamification/LessonControlBar";
import { LessonPageCard } from "@/components/gamification/LessonPageCard";

interface DrawFirstLetterRepProps {
  verse: VerseSegment;
  verseMarkers: Record<number, number>;
  annotations: WordAnnotationMap;
  // The reading view's own real page layout (see lib/useChapterReadingLayout.ts) — Learn flow
  // only caller, so always set; the verse renders on the SAME real reading-view page/size/
  // position as browsing, via LessonPageCard.tsx.
  layout: ChapterReadingLayout;
  onComplete: () => void;
}

// Stage 4: the active verse's own words start blank (an underscore stand-in) and turn into
// just their first letter, one at a time, as the reader draws each one freehand on the
// canvas below — never the full word. Everything else on the page (every other verse) stays
// fully printed the whole time. Turns land only on words — a word's own punctuation appears the
// moment that word is drawn; a word auto-advances once handwriting recognition detects a legible
// character (never grades correctness, only that something was drawn) — the manual Next/Finish
// button stays as a fallback.
export function DrawFirstLetterRep({ verse, layout, onComplete }: DrawFirstLetterRepProps) {
  const tokens = useMemo(() => buildDrawTokens(verse.text, {}), [verse.text]);
  const clauseRanges = useMemo(() => senseLineWordRanges(verse.text), [verse.text]);
  const tokenIndicesByClause = useMemo(() => bucketTokenIndicesByClause(tokens, clauseRanges), [tokens, clauseRanges]);
  const [tokenIndex, setTokenIndex] = useState(() => nextWordTokenIndex(tokens, 0));
  const [revealedTokenIndices, setRevealedTokenIndices] = useState<number[]>([]);
  const [hasInk, setHasInk] = useState(false);
  const { canvasRef, onPointerDown, onPointerMove, onPointerUp } = useDrawingCanvas();

  const currentToken = tokens[tokenIndex];
  const isWordToken = currentToken?.kind === "word";

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    autoRecognize.cancel();
  }

  // Drawing a word's letter reveals that word together with its own punctuation — nothing of a
  // comma or quote mark shows until the word it belongs to has been drawn — and the turn moves
  // straight on to the next WORD; punctuation never takes a turn of its own.
  function handleNext() {
    if (!currentToken) return;
    setRevealedTokenIndices((prev) => [...prev, ...withOwnPunctuation(tokens, tokenIndex)]);
    clearCanvas();
    const next = nextWordTokenIndex(tokens, tokenIndex + 1);
    if (next === -1) {
      onComplete();
    } else {
      setTokenIndex(next);
    }
  }

  const autoRecognize = useAutoRecognizeDraw({
    canvasRef,
    enabled: isWordToken && hasInk,
    onRecognized: handleNext,
  });

  function handleStrokeEnd() {
    onPointerUp();
    autoRecognize.notifyStrokeEnd();
  }

  // A verse the ESV (or another provider) omits entirely comes back as an empty string — e.g.
  // Mark 11:26, a real, documented gap (see lib/bibleProviders/esv.ts), not a rare edge case
  // — which tokenizes to no word tokens here, meaning no currentToken from the very start.
  // Auto-completes straight through instead of sitting on a genuinely blank stage forever.
  useEffect(() => {
    if (!currentToken) onComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when tokenIndex changes
  }, [tokenIndex]);

  if (!currentToken) return null;

  // No verse-number sup here — ChapterVerseRun.tsx already renders that verse's own real
  // number unconditionally (see LessonPageCard.tsx's own doc comment). Called once per clause
  // (see LessonPageCard.tsx's own renderActiveVerse doc comment) — renders just the tokens
  // bucketed into THIS clause (see tokenIndicesByClause above) so a multi-clause verse still
  // renders through the same hanging-indent line structure a non-active verse gets.
  function renderActiveVerse(_: VerseSegment, range: SenseLineWordRange) {
    // A rendered line can hold several clauses (short ones get joined — see
    // lib/senseLineWordRanges.ts's mergeRangesToFit), so gather every clause starting inside it.
    const tokenIndices = clauseRanges.flatMap((clause, clauseIndex) =>
      clause.startIndex >= range.startIndex && clause.startIndex < range.endIndex ? (tokenIndicesByClause[clauseIndex] ?? []) : [],
    );
    return (
      <Fragment>
        {tokenIndices.map((index) => {
          const token = tokens[index];
          const isRevealed = revealedTokenIndices.includes(index);
          const isCurrent = index === tokenIndex;
          // Reference tokens (e.g. "3:16") show in full either way, same convention every
          // other first-letter display in the app follows — see lib/verseFirstLetters.ts. A
          // drawn word shows just its letter, so what's been written reads "J, t s o J C," —
          // letters one space apart with their own punctuation. Nothing of the verse shows ahead
          // of the reader: a word not yet drawn is blank space its own length, and punctuation
          // (its own token here) stays hidden until the word it belongs to is drawn.
          const display = token.isReference
            ? token.text
            : token.kind !== "word"
              ? isRevealed
                ? token.text
                : hiddenWordBlank(token.text)
              : isRevealed
                ? (firstWordCharacter(token.text) ?? token.text)
                : wordLetterPlaceholder(token.text, false);
          // A drawn letter's unit (the letter plus its own punctuation) ends wherever a space
          // follows — that's where the extra first-letter gap goes (see lib/firstLetterGap.ts).
          const stateClassName = isCurrent
            ? "text-brand-700 underline decoration-2 underline-offset-4 dark:text-brand-300"
            : isRevealed
              ? token.spaceAfter
                ? FIRST_LETTER_GAP_CLASS
                : ""
              : "text-ink-muted/50 dark:text-zinc-700";
          return (
            <Fragment key={index}>
              <span className={stateClassName}>{display}</span>
              {token.spaceAfter && " "}
            </Fragment>
          );
        })}
      </Fragment>
    );
  }

  // The current draw token's own `wordIndex` when it's a word token — falls back to the
  // nearest earlier word token's index for a punctuation/verse-number token currently active,
  // so the page-selection math below always has SOME real word position to key off, even
  // between two words.
  let activeWordIndex = 0;
  for (let index = tokenIndex; index >= 0; index--) {
    const candidate = tokens[index];
    if (candidate?.kind === "word" && candidate.wordIndex !== undefined) {
      activeWordIndex = candidate.wordIndex;
      break;
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <LessonPageCard layout={layout} activeVerse={verse} activeWordIndex={activeWordIndex} renderActiveVerse={renderActiveVerse} />

      <LessonControlBar dockRef={layout.dockRef} verseText={verse.text}>
        <p className="flex items-center gap-1.5 self-center text-caption font-semibold uppercase tracking-wide text-brand-500 [.lesson-sheet-controls_&]:hidden">
          Learn <InfoTip text={INFO_TIPS.drawFirstLetterRep} />
        </p>
        <canvas
          ref={canvasRef}
          onPointerDown={(event) => {
            setHasInk(true);
            onPointerDown(event);
          }}
          onPointerMove={onPointerMove}
          onPointerUp={handleStrokeEnd}
          onPointerLeave={handleStrokeEnd}
          className="h-20 w-full touch-none rounded-xl border border-line bg-white [.lesson-sheet-controls_&]:h-auto [.lesson-sheet-controls_&]:min-h-0 [.lesson-sheet-controls_&]:flex-1"
        />
        <div className="flex w-full items-center justify-between">
          <button type="button" onClick={clearCanvas} className="text-sm font-medium text-ink-muted hover:underline">
            Clear
          </button>
          <motion.button
            type="button"
            whileTap={TAP_SCALE}
            onClick={handleNext}
            className="rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white"
          >
            {tokenIndex + 1 >= tokens.length ? "Finish" : "Next"}
          </motion.button>
        </div>
        <AutoCompleteButton onClick={onComplete} />
      </LessonControlBar>
    </div>
  );
}
