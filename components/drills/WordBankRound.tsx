"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { VerseSegment } from "@/types";
import { getWordBankIndicesForRound } from "@/lib/wordBankRounds";
import { playCorrectSfx, playIncorrectSfx } from "@/lib/audio";
import { TAP_SCALE } from "@/lib/motionTokens";
import { tokenizeVerseWords, stripPunctuation } from "@/lib/verseWords";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

interface WordBankRoundProps {
  verse: VerseSegment;
  round: number;
  onComplete: () => void;
}

export function WordBankRound({ verse, round, onComplete }: WordBankRoundProps) {
  const words = useMemo(() => tokenizeVerseWords(verse.text), [verse.text]);
  const blankIndices = useMemo(() => getWordBankIndicesForRound(words.length, round), [words.length, round]);
  const [placedCount, setPlacedCount] = useState(0);
  const [usedTileIds, setUsedTileIds] = useState<Set<number>>(new Set());
  const [wrongTileId, setWrongTileId] = useState<number | null>(null);
  const tray = useMemo(
    () =>
      blankIndices
        .map((index) => ({ tileId: index, word: words[index] }))
        .sort((a, b) => stripPunctuation(a.word).localeCompare(stripPunctuation(b.word))),
    // Re-derive only when the round changes, not on every placement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [round],
  );

  const targetIndex = blankIndices[placedCount];
  const targetWord = targetIndex !== undefined ? words[targetIndex] : undefined;

  // A mistake restarts this round from its first blank rather than just retrying the missed
  // one — matches the same "a mistake resets the current section" rule applied to
  // FirstLetterTypeRep, so partial credit within a Learn round is never kept after a slip.
  function handleTileClick(tileId: number, word: string) {
    if (!targetWord) return;
    if (stripPunctuation(word) === stripPunctuation(targetWord)) {
      playCorrectSfx();
      setWrongTileId(null);
      setUsedTileIds((prev) => new Set(prev).add(tileId));
      const next = placedCount + 1;
      setPlacedCount(next);
      if (next >= blankIndices.length) onComplete();
    } else {
      playIncorrectSfx();
      setWrongTileId(tileId);
      setPlacedCount(0);
      setUsedTileIds(new Set());
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
          Tap the missing words in order — Round {round} of 3 <InfoTip text={INFO_TIPS.wordBankRound} />
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
        {tray
          .filter((entry) => !usedTileIds.has(entry.tileId))
          .map((entry) => (
            <motion.button
              key={entry.tileId}
              type="button"
              whileTap={TAP_SCALE}
              onClick={() => handleTileClick(entry.tileId, entry.word)}
              className={`rounded-lg px-3 py-2 text-base font-medium text-white ${
                wrongTileId === entry.tileId ? "bg-heart-500" : "bg-brand-500"
              }`}
            >
              {stripPunctuation(entry.word)}
            </motion.button>
          ))}
      </div>
      <AutoCompleteButton onClick={onComplete} />
    </div>
  );
}
