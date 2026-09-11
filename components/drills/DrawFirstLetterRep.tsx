"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { VerseSegment } from "@/types";
import { wordLetterPlaceholder } from "@/lib/verseWords";
import { buildDrawTokens } from "@/lib/verseDrawTokens";
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
// fully printed the whole time. Punctuation/verse-number tokens auto-reveal on their own,
// long enough to read before moving on; a word token auto-advances once handwriting
// recognition detects a legible character (never grades correctness, only that something was
// drawn) — the manual Next/Finish button stays as a fallback.
export function DrawFirstLetterRep({ verse, layout, onComplete }: DrawFirstLetterRepProps) {
  const tokens = useMemo(() => buildDrawTokens(verse.text, {}), [verse.text]);
  const [tokenIndex, setTokenIndex] = useState(0);
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

  function handleNext() {
    if (!currentToken) return;
    setRevealedTokenIndices((prev) => [...prev, tokenIndex]);
    clearCanvas();
    const next = tokenIndex + 1;
    if (next >= tokens.length) {
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

  // Punctuation tokens auto-reveal on their own, long enough to read before moving on. A
  // verse the ESV (or another provider) omits entirely comes back as an empty string — e.g.
  // Mark 11:26, a real, documented gap (see lib/bibleProviders/esv.ts), not a rare edge case
  // — which tokenizes to zero tokens here, meaning no currentToken from the very start.
  // Auto-completes straight through instead of sitting on a genuinely blank stage forever.
  useEffect(() => {
    if (!currentToken) {
      onComplete();
      return;
    }
    if (isWordToken) return;
    const timer = setTimeout(() => handleNext(), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when tokenIndex changes
  }, [tokenIndex]);

  if (!currentToken) return null;

  // No verse-number sup here — ChapterVerseRun.tsx already renders that verse's own real
  // number unconditionally (see LessonPageCard.tsx's own doc comment).
  const activeVerseWords = (
    <Fragment>
      {tokens.map((token, index) => {
        const isRevealed = revealedTokenIndices.includes(index);
        const isCurrent = index === tokenIndex;
        // Reference tokens (e.g. "3:16") show in full either way, same convention every other
        // first-letter display in the app follows — see lib/verseFirstLetters.ts. Every other
        // word token pads out to its own real length (wordLetterPlaceholder), so its letter (or
        // its blank, before it's revealed) still sits where that word would actually be.
        const display = token.isReference || token.kind !== "word" ? token.text : wordLetterPlaceholder(token.text, isRevealed);
        const stateClassName = isCurrent
          ? "text-brand-700 underline decoration-2 underline-offset-4 dark:text-brand-300"
          : isRevealed
            ? ""
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

  return (
    <div className="flex flex-col gap-3">
      <LessonPageCard layout={layout} activeVerse={verse} renderActiveVerse={() => activeVerseWords} />

      <LessonControlBar dockRef={layout.dockRef}>
        <p className="flex items-center gap-1.5 self-center text-caption font-semibold uppercase tracking-wide text-brand-500">
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
          className="h-20 w-full touch-none rounded-xl border border-line bg-white"
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
