"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { VerseSegment } from "@/types";
import { playCorrectSfx, playIncorrectSfx } from "@/lib/audio";
import { TAP_SCALE } from "@/lib/motionTokens";
import { tokenizeVerseWords, stripPunctuation } from "@/lib/verseWords";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

interface FillInTheBlankRepProps {
  verse: VerseSegment;
  onComplete: () => void;
}

// Blanks every other word — enough of the verse still visible to anchor the reader, enough
// missing to actually require recall rather than just reading it back.
function blankIndicesFor(wordCount: number): number[] {
  const indices: number[] = [];
  for (let index = 1; index < wordCount; index += 2) indices.push(index);
  return indices;
}

// A mistake reverts to the last checkpoint rather than the very first blank — same
// "restart the section, not the whole thing" leniency this app already extends elsewhere
// (see ReviewChain's own per-verse restart) — so one slip late in a long verse doesn't wipe
// every correct tile placed before it.
const CHECKPOINT_SIZE = 4;

// Tap the missing words, in order, from a bank below — tiles are alphabetized (punctuation
// stripped) rather than shuffled, so their position never hints at the answer. A wrong tap
// flashes red and reverts to the last checkpoint instead of the very first blank.
export function FillInTheBlankRep({ verse, onComplete }: FillInTheBlankRepProps) {
  const words = useMemo(() => tokenizeVerseWords(verse.text), [verse.text]);
  const blankIndices = useMemo(() => blankIndicesFor(words.length), [words.length]);
  const [usedTileIds, setUsedTileIds] = useState<Set<number>>(new Set());
  const [wrongTileId, setWrongTileId] = useState<number | null>(null);

  const tray = useMemo(
    () =>
      blankIndices
        .map((index) => ({ tileId: index, word: words[index] }))
        .sort((a, b) => stripPunctuation(a.word).localeCompare(stripPunctuation(b.word))),
    // Re-derived only when the verse changes, not on every placement — a re-sort mid-round
    // would shuffle tiles the reader hasn't tapped yet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [verse.id],
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
      if (next >= blankIndices.length) onComplete();
    } else {
      playIncorrectSfx();
      setWrongTileId(tileId);
      const lastCheckpoint = Math.floor(placedCount / CHECKPOINT_SIZE) * CHECKPOINT_SIZE;
      setUsedTileIds((prev) => new Set(Array.from(prev).slice(0, lastCheckpoint)));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
          Fill in the blanks <InfoTip text={INFO_TIPS.fillInTheBlankRep} />
        </p>
        <p className="text-title">{verse.reference}</p>
      </div>
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-lg leading-relaxed">
        {words.map((word, index) => {
          if (!blankIndices.includes(index)) return <span key={index}>{word}</span>;
          const slotPosition = blankIndices.indexOf(index);
          const isFilled = slotPosition < placedCount;
          return (
            <span
              key={index}
              className={`inline-flex min-w-12 items-center justify-center rounded-lg border-2 border-dashed px-2 py-0.5 ${
                isFilled
                  ? "border-brand-500 bg-brand-50 font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                  : "border-line dark:border-zinc-700"
              }`}
            >
              {isFilled ? word : " "}
            </span>
          );
        })}
      </p>
      <div className="flex flex-wrap gap-2 rounded-xl bg-mist p-3 dark:bg-zinc-900">
        {tray.map((entry) => (
          <motion.button
            key={entry.tileId}
            type="button"
            whileTap={TAP_SCALE}
            onClick={() => handleTileClick(entry.tileId, entry.word)}
            className={`rounded-lg px-3 py-2 text-base font-medium text-white ${
              wrongTileId === entry.tileId ? "bg-heart-500" : "bg-brand-500"
            } ${usedTileIds.has(entry.tileId) ? "invisible" : ""}`}
          >
            {stripPunctuation(entry.word)}
          </motion.button>
        ))}
      </div>
      <AutoCompleteButton onClick={onComplete} />
    </div>
  );
}
