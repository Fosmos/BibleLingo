"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { VerseSegment } from "@/types";
import { playCorrectSfx, playIncorrectSfx } from "@/lib/audio";
import { TAP_SCALE } from "@/lib/motionTokens";
import { tokenizeVerseWords, stripPunctuation } from "@/lib/verseWords";
import { blankIndicesImportantFirst } from "@/lib/wordImportance";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import type { SenseLineWordRange } from "@/lib/senseLineWordRanges";
import { LessonControlBar } from "@/components/gamification/LessonControlBar";
import { LessonPageCard } from "@/components/gamification/LessonPageCard";

interface FillInTheBlankRepProps {
  verse: VerseSegment;
  // The reading view's own real page layout (see lib/useChapterReadingLayout.ts) — Learn flow
  // only caller, so always set; the verse renders on the SAME real reading-view page/size/
  // position as browsing, via LessonPageCard.tsx.
  layout: ChapterReadingLayout;
  onComplete: () => void;
}

// Two passes: the first blanks about half the verse's own words (content/meaning-bearing ones
// prioritized — see lib/wordImportance.ts), leaving enough visible to anchor the reader; the
// second blanks every word, the full recall check. Same "progressively less scaffolding" shape
// this app's other 2-rep drills already follow.
const REP_COUNT = 2;

// Tap the missing words, in order, from a bank below — tiles are alphabetized (punctuation
// stripped) rather than shuffled, so their position never hints at the answer. A wrong tap just
// flashes red and stays available to try again — every tile already placed correctly stays
// placed, so one slip never costs any real progress (see handleTileClick).
export function FillInTheBlankRep({ verse, layout, onComplete }: FillInTheBlankRepProps) {
  const words = useMemo(() => tokenizeVerseWords(verse.text), [verse.text]);
  const [repIndex, setRepIndex] = useState(0);
  const blankIndices = useMemo(
    () => blankIndicesImportantFirst(words, repIndex === 0 ? Math.ceil(words.length / 2) : words.length),
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
  const targetIndex = blankIndices[placedCount];
  const targetWord = targetIndex !== undefined ? words[targetIndex] : undefined;

  function handleTileClick(tileId: number, word: string) {
    if (!targetWord || usedTileIds.has(tileId)) return;
    // Compared by word, not index — the same word can appear at more than one blank.
    if (stripPunctuation(word) === stripPunctuation(targetWord)) {
      playCorrectSfx();
      setWrongTileId(null);
      const next = placedCount + 1;
      setUsedTileIds((prev) => new Set(prev).add(tileId));
      if (next >= blankIndices.length) {
        if (repIndex + 1 >= REP_COUNT) {
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
  // own `-indent-6` (a negative text-indent, for its hanging-indent layout) is CSS-inherited, and
  // an `inline-block` establishes its own line box for its own content — so without resetting it
  // here, that negative indent applies AGAIN to this span's own text, shifting it left by that
  // same amount and painting it back over whatever word came right before it.
  //
  // A blank always holds its own word, just invisible until placed — so it's exactly that word's
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
          return (
            <span key={index}>
              <span
                className={`inline-block indent-0 whitespace-nowrap border-b-2 font-medium leading-none ${
                  isFilled
                    ? "border-brand-500 text-brand-700 dark:text-brand-300"
                    : "border-dashed border-line dark:border-zinc-700"
                }`}
              >
                <span className={isFilled ? "" : "invisible"} aria-hidden={isFilled ? undefined : true}>
                  {word}
                </span>
              </span>{" "}
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
            · Rep {repIndex + 1} of {REP_COUNT}
          </span>
          <InfoTip text={INFO_TIPS.fillInTheBlankRep} />
        </p>
        {/* Inside the Mind Map sheet's drill zone (tagged `lesson-sheet-controls` — see
            LessonBottomSheet.tsx) the options aren't boxed at all: they spread straight across
            the whole zone, centered in whatever height it has. */}
        <div className="flex w-full flex-wrap justify-center gap-2 rounded-xl bg-mist p-3 dark:bg-zinc-900 [.lesson-sheet-controls_&]:flex-1 [.lesson-sheet-controls_&]:content-center [.lesson-sheet-controls_&]:bg-transparent [.lesson-sheet-controls_&]:p-0 dark:[.lesson-sheet-controls_&]:bg-transparent">
          {tray.map((entry) => (
            <motion.button
              key={entry.tileId}
              type="button"
              whileTap={TAP_SCALE}
              onClick={() => handleTileClick(entry.tileId, entry.word)}
              className={`rounded-lg px-3 py-2 text-base font-medium text-white [.lesson-sheet-controls_&]:py-1.5 ${
                wrongTileId === entry.tileId ? "bg-heart-500" : "bg-brand-500"
              } ${usedTileIds.has(entry.tileId) ? "invisible" : ""}`}
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
