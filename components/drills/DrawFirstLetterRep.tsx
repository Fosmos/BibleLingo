"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { VerseSegment } from "@/types";
import { firstWordCharacter } from "@/lib/verseWords";
import { buildDrawTokens } from "@/lib/verseDrawTokens";
import { useDrawingCanvas } from "@/lib/useDrawingCanvas";
import { useAutoRecognizeDraw } from "@/lib/useAutoRecognizeDraw";
import { TAP_SCALE } from "@/lib/motionTokens";
import type { WordAnnotationMap } from "@/lib/verseHighlights";
import { AnnotatedVerseWord } from "@/components/drills/AnnotatedVerseWord";
import { VerseNumberMarker } from "@/components/drills/VerseNumberMarker";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import { VerseReferenceHeader } from "@/components/ui/VerseReferenceHeader";
import { VerseTextLine } from "@/components/ui/VerseTextLine";

function tokenStateClass(index: number, tokenIndex: number): string {
  return index === tokenIndex
    ? "rounded bg-brand-100 px-1 font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
    : index < tokenIndex
      ? "text-ink-muted dark:text-zinc-600"
      : "text-ink dark:text-zinc-100";
}

interface DrawFirstLetterRepProps {
  verse: VerseSegment;
  verseMarkers: Record<number, number>;
  annotations: WordAnnotationMap;
  onComplete: () => void;
}

// Stage 4: the whole verse shows up front, current item highlighted, while the user draws it
// freehand on a canvas filling the bottom half of the screen. Punctuation/verse-number tokens
// auto-reveal on their own; a word token auto-advances once handwriting recognition detects a
// legible character (never grades correctness, only that something was drawn) — the manual
// Next/Finish button stays as a fallback. Next reveals the PRINTED item in a growing strip
// under the verse. Full screen, matching this Learn flow's other full-viewport stages.
export function DrawFirstLetterRep({ verse, verseMarkers, annotations, onComplete }: DrawFirstLetterRepProps) {
  const tokens = useMemo(() => buildDrawTokens(verse.text, verseMarkers), [verse.text, verseMarkers]);
  const [tokenIndex, setTokenIndex] = useState(0);
  // Indices into `tokens`, in reveal order — display text/case/spacing are derived from the
  // token itself at render time below rather than duplicated here, so the letter for each
  // token always matches the word's own real capitalization.
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

  // Punctuation/verse-number tokens auto-reveal on their own, long enough to read before moving on.
  useEffect(() => {
    if (!currentToken || isWordToken) return;
    const timer = setTimeout(() => handleNext(), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when tokenIndex changes
  }, [tokenIndex]);

  if (!currentToken) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper dark:bg-zinc-950">
      <div className="flex items-center justify-between px-4 pt-3">
        <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
          Learn <InfoTip text={INFO_TIPS.drawFirstLetterRep} />
        </p>
        <AutoCompleteButton onClick={onComplete} />
      </div>
      <div className="px-4">
        <VerseReferenceHeader book={verse.book} chapter={verse.chapter} verseNumber={verse.verseNumber} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <p className="text-lg leading-relaxed">
          <VerseTextLine chapter={verse.chapter} verseNumber={verse.verseNumber} />
          {tokens.map((token, index) => {
            const stateClassName = tokenStateClass(index, tokenIndex);
            if (token.kind === "verseNumber") {
              return (
                <span key={index}>
                  <br />
                  <VerseNumberMarker number={Number(token.text)} className={stateClassName} />
                  {token.spaceAfter && " "}
                </span>
              );
            }
            return (
              <span key={index}>
                <AnnotatedVerseWord
                  word={token.text}
                  annotation={token.wordIndex !== undefined ? annotations[token.wordIndex] : undefined}
                  className={stateClassName}
                />
                {token.spaceAfter && " "}
              </span>
            );
          })}
        </p>
        {revealedTokenIndices.length > 0 && (
          <p className="mt-4 text-lg font-bold leading-snug text-brand-700 dark:text-brand-300">
            {revealedTokenIndices.map((index) => {
              const token = tokens[index];
              const display =
                token.kind === "word" && !token.isReference ? (firstWordCharacter(token.text) ?? "") : token.text;
              return (
                <span key={index}>
                  {display}
                  {token.spaceAfter && " "}
                </span>
              );
            })}
          </p>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 border-t border-line bg-mist/40 p-4 pb-[env(safe-area-inset-bottom)] dark:border-zinc-800 dark:bg-zinc-900/40">
        <canvas
          ref={canvasRef}
          onPointerDown={(event) => {
            setHasInk(true);
            onPointerDown(event);
          }}
          onPointerMove={onPointerMove}
          onPointerUp={handleStrokeEnd}
          onPointerLeave={handleStrokeEnd}
          className="min-h-0 w-full flex-1 touch-none rounded-xl border border-line bg-white"
        />
        <div className="flex items-center justify-between">
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
      </div>
    </div>
  );
}
