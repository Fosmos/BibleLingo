"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { VerseSegment } from "@/types";
import { playCorrectSfx, playIncorrectSfx } from "@/lib/audio";
import { TAP_SCALE } from "@/lib/motionTokens";
import { tokenizeVerseWords, stripPunctuation, splitWordPunctuation } from "@/lib/verseWords";
import { blankIndicesImportantFirst } from "@/lib/wordImportance";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { senseLineWordRanges, type SenseLineWordRange } from "@/lib/senseLineWordRanges";
import { LessonControlBar } from "@/components/gamification/LessonControlBar";
import { LessonPageCard } from "@/components/gamification/LessonPageCard";
import { useReferenceGate } from "@/components/gamification/ReferenceGate";

interface FillInTheBlankRepProps {
  verse: VerseSegment;
  // The reading view's own real page layout (see lib/useChapterReadingLayout.ts) — Learn flow
  // only caller, so always set; the verse renders on the SAME real reading-view page/size/
  // position as browsing, via LessonPageCard.tsx.
  layout: ChapterReadingLayout;
  // Reps in all (the Learn intensity slider's choice, 2 or 3) — any after the second blank every word.
  reps?: number;
  // Every word blank from the first rep (a sense-line stage — lib/learnSteps.ts).
  allBlank?: boolean;
  onComplete: () => void;
}

// Two passes: the first blanks about half the verse's own words (content/meaning-bearing ones
// prioritized — see lib/wordImportance.ts), leaving enough visible to anchor the reader; the
// second blanks every word, the full recall check. Same "progressively less scaffolding" shape
// this app's other 2-rep drills already follow. A third rep (`reps`) repeats the all-blanked pass.

// Tap the missing words, in order, from a bank below — only the current sense line's words at a
// time, in a grid across the full width, alphabetized (punctuation stripped) rather than shuffled
// so their position never hints at the answer. A wrong tap just
// flashes red and stays available to try again — every tile already placed correctly stays
// placed, so one slip never costs any real progress (see handleTileClick).
export function FillInTheBlankRep({ verse, layout, reps = 2, allBlank = false, onComplete }: FillInTheBlankRepProps) {
  const repCount = reps;
  const words = useMemo(() => tokenizeVerseWords(verse.text), [verse.text]);
  const [repIndex, setRepIndex] = useState(0);
  const blankIndices = useMemo(
    () => blankIndicesImportantFirst(words, repIndex === 0 && !allBlank ? Math.ceil(words.length / 2) : words.length),
    // Re-derived only on a real verse/rep change, not on every placement — a re-shuffle mid-round
    // would shuffle tiles the reader hasn't tapped yet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [verse.id, repIndex],
  );
  const [usedTileIds, setUsedTileIds] = useState<Set<number>>(new Set());
  const [wrongTileId, setWrongTileId] = useState<number | null>(null);

  const tray = useMemo(
    () =>
      blankIndices
        .map((index) => ({ tileId: index, word: words[index] }))
        .sort((a, b) => stripPunctuation(a.word).localeCompare(stripPunctuation(b.word))),
    // Re-derived only when the verse or rep changes, not on every placement — a re-sort mid-round
    // would shuffle tiles the reader hasn't tapped yet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [verse.id, repIndex],
  );

  const placedCount = usedTileIds.size;
  // No blank is "next" while the stage's reference is entered first (ReferenceGate.tsx).
  const referenceFirst = useReferenceGate() !== null;
  const targetIndex = blankIndices[placedCount];
  const targetWord = targetIndex !== undefined ? words[targetIndex] : undefined;
  // The sense line holding the next blank — the tray offers just its words, then moves on.
  const lineRanges = useMemo(() => senseLineWordRanges(verse.text), [verse.text]);
  const line = lineRanges.find((range) => targetIndex !== undefined && targetIndex >= range.startIndex && targetIndex < range.endIndex);
  const lineTiles = line ? tray.filter((entry) => entry.tileId >= line.startIndex && entry.tileId < line.endIndex) : [];
  const columns = lineTiles.length <= 1 ? "grid-cols-1" : lineTiles.length === 2 ? "grid-cols-2" : "grid-cols-3";

  function handleTileClick(tileId: number, word: string) {
    if (!targetWord || usedTileIds.has(tileId)) return;
    // Compared by word, not index — the same word can appear at more than one blank.
    if (stripPunctuation(word) === stripPunctuation(targetWord)) {
      playCorrectSfx();
      setWrongTileId(null);
      const next = placedCount + 1;
      setUsedTileIds((prev) => new Set(prev).add(tileId));
      if (next >= blankIndices.length) {
        if (repIndex + 1 >= repCount) {
          onComplete();
        } else {
          setRepIndex((prev) => prev + 1);
          setUsedTileIds(new Set());
        }
      }
    } else {
      playIncorrectSfx();
      setWrongTileId(tileId);
    }
  }

  // No verse-number sup here — ChapterVerseRun.tsx already renders that verse's own real
  // number unconditionally (see LessonPageCard.tsx's own doc comment). Called once per clause
  // (see LessonPageCard.tsx's own renderActiveVerse doc comment) — slices `words` down to just
  // this clause's own range so a multi-clause verse still renders through the same hanging-
  // indent line structure a non-active verse gets.
  // `indent-0` on the blank span below undoes something otherwise invisible: SenseLineRow.tsx's
  // own `-indent-5` (a negative text-indent, for its hanging-indent layout) is CSS-inherited, and
  // an `inline-block` establishes its own line box for its own content — so without resetting it
  // here, that negative indent applies AGAIN to this span's own text, shifting it left by that
  // same amount and painting it back over whatever word came right before it.
  //
  // A blank always holds its own word's letters, just invisible until placed — so it's exactly that word's
  // width from the start, and filling it in never widens the line. (A fixed-width blank used to
  // grow on fill and knock the rest of the line down onto the next one.) No side margin either:
  // the ordinary trailing space separates it, the same room sense-line merging measured for.
  function renderActiveVerse(_: VerseSegment, range: SenseLineWordRange) {
    return (
      <>
        {words.slice(range.startIndex, range.endIndex).map((word, offset) => {
          const index = range.startIndex + offset;
          if (!blankIndices.includes(index)) return <span key={index}>{word} </span>;
          const slotPosition = blankIndices.indexOf(index);
          const isFilled = slotPosition < placedCount;
          // The box holds just the letters — the word's punctuation always shows beside it.
          const { lead, core, trail } = splitWordPunctuation(word);
          return (
            <span key={index}>
              {lead}
              <span
                // Filled: dark terracotta on a pale wash, underlined. The next blank: the pale wash
                // ringed in terracotta. Later blanks: plain sand (the lesson view, no sage).
                className={`-mr-[.12em] inline-block rounded-md px-[.12em] indent-0 whitespace-nowrap leading-tight transition-colors ${
                  isFilled
                    ? "border-b-2 border-brand-300 bg-brand-100 text-brand-900 dark:bg-brand-900/40 dark:text-brand-100"
                    : slotPosition === placedCount && !referenceFirst
                      ? "bg-brand-100 ring-2 ring-inset ring-brand-500 dark:bg-brand-900/40"
                      : "bg-sand-300 dark:bg-zinc-700"
                }`}
              >
                {isFilled ? (
                  core
                ) : (
                  <span className="invisible" aria-hidden="true">
                    {core}
                  </span>
                )}
              </span>
              {trail}{" "}
            </span>
          );
        })}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <LessonPageCard layout={layout} activeVerse={verse} activeWordIndex={targetIndex ?? words.length} renderActiveVerse={renderActiveVerse} />

      <LessonControlBar dockRef={layout.dockRef} verseText={verse.text}>
        <p className="flex items-center gap-1.5 self-center text-caption font-semibold uppercase tracking-wide text-brand-500 [.lesson-sheet-controls_&]:hidden">
          Fill in the blanks
          <span className="font-normal normal-case tracking-normal text-ink-muted">
            · Rep {repIndex + 1} of {repCount}
          </span>
          <InfoTip text={INFO_TIPS.fillInTheBlankRep} />
        </p>
        {/* Inside the Mind Map sheet's drill zone (tagged `lesson-sheet-controls` — see
            LessonBottomSheet.tsx) the options aren't boxed at all: they spread straight across
            the whole zone, centered in whatever height it has. */}
        <div className={`grid w-full gap-2 rounded-organic bg-sand-100 p-3 dark:bg-zinc-900 [.lesson-sheet-controls_&]:flex-1 [.lesson-sheet-controls_&]:content-center [.lesson-sheet-controls_&]:bg-transparent [.lesson-sheet-controls_&]:p-0 dark:[.lesson-sheet-controls_&]:bg-transparent ${columns}`}>
          {lineTiles.map((entry) => (
            <motion.button
              key={entry.tileId}
              type="button"
              whileTap={TAP_SCALE}
              onClick={() => handleTileClick(entry.tileId, entry.word)}
              // Word tiles as pills; a used one stays as a dashed outline so the row never jumps.
              disabled={usedTileIds.has(entry.tileId)}
              className={`w-full truncate rounded-full border-2 px-3 py-[11px] text-[16px] font-bold ${
                usedTileIds.has(entry.tileId)
                  ? "border-dashed border-sand-300 bg-transparent text-sand-500"
                  : wrongTileId === entry.tileId
                    ? "border-transparent bg-brand-300 text-ink"
                    : "border-transparent bg-sand-200 text-ink dark:bg-zinc-800 dark:text-zinc-100"
              }`}
            >
              {stripPunctuation(entry.word)}
            </motion.button>
          ))}
        </div>
        <AutoCompleteButton onClick={onComplete} />
      </LessonControlBar>
    </div>
  );
}
