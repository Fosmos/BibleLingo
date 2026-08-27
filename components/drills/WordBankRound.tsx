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

// The number of checkpoints
enum eDifficulty {
  Easy = 8,
  Medium = 4,
  Hard = 0
}
// TODO: Make this selection a UI element
let difficulty = eDifficulty.Medium;

export function WordBankRound({ verse, round, onComplete }: WordBankRoundProps) {
  // All the words in the verse
  const words = useMemo(() => tokenizeVerseWords(verse.text), [verse.text]);

  // The words missing from the verse
  const blankIndices = useMemo(() => getWordBankIndicesForRound(words.length, round), [words.length, round]);

  // The set of indices, relative to `words`, of the correctly placed words
  const [usedTileIds, setUsedTileIds] = useState<Set<number>>(new Set());

  // The Id of the incorrect tile
  const [wrongTileId, setWrongTileId] = useState<number | null>(null);

  // The latest checkpoint the user has hit (e.g., 1, 2, ...)
  const [currentCheckpoint, setCurrentCheckpoint] = useState<number>(0);

  const tray = useMemo(
    () =>
      blankIndices
        .map((index) => ({ tileId: index, word: words[index] }))
        .sort((a, b) => stripPunctuation(a.word).localeCompare(stripPunctuation(b.word))),
    // Re-derive only when the round changes, not on every placement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [round],
  );

  const placedCount = usedTileIds.size; // The number of correctly picked works
  const targetIndex = blankIndices[placedCount]; // The index of the next correct word, relative to the `words`
  const targetWord = targetIndex !== undefined ? words[targetIndex] : undefined; // The next correct word

  // The value of a checkpoint is the number of blanks in the verse divided by the difficulty
  // If there are 8 words and the difficulty is Medium (=4), then the checkpoint will be every 2 correct words
  // Index 0 when on hard mode (i.e., no checkpoints)
  const checkpoint = difficulty == eDifficulty.Hard ? 0 : Math.ceil(blankIndices.length / difficulty);

  // A mistake restarts this round from the latest checkpoint rather than just retrying the missed
  // one so partial credit within a Learn round is never kept after a slip.
  // TODO: Add a mistakte counter to revert to the previous exercise
  function handleTileClick(tileId: number, word: string) {
    if (!targetWord) return;

    // Have to compare words instead of indices, since there could be
    // more than one of the same word
    if (stripPunctuation(word) === stripPunctuation(targetWord)) {
      playCorrectSfx();
      setWrongTileId(null); // Clears any 'incorrect' tile coloring

      // Track this new correct tile, so it isn't picked again
      setUsedTileIds((prev) => new Set(prev).add(tileId));

      // Update which checkpoint the user is at
      const next = placedCount + 1;
      if (placedCount > 0 && checkpoint > 0 && next % checkpoint == 0)
        setCurrentCheckpoint((prev) => prev = next / checkpoint);

      // If there are no more words, then complete the task
      if (next >= blankIndices.length) onComplete();
    } else {
      playIncorrectSfx();
      setWrongTileId(tileId); // This will color the incorrect tile red

      // Compute the number of words to revert too based on the current checkpoint
      // itemsToRemove = <number of correctly chosen words so far> - <latest checkpoint>
      const itemsToRemove = placedCount - (checkpoint * (currentCheckpoint));

      // Resets the word bank to the latest checkpoint
      setUsedTileIds((prev) => {
        const arr = Array.from(prev);
        return new Set(arr.slice(0, arr.length - itemsToRemove));
      });
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
          // For each word missing from the verse, create a button in a grid
          .map((entry) => (
            <motion.button
              key={entry.tileId}
              type="button"
              whileTap={TAP_SCALE}
              onClick={() => {
                // Only handle clicks for tiles not already used
                if (!usedTileIds.has(entry.tileId)) handleTileClick(entry.tileId, entry.word)
              }}
              className={`rounded-lg px-3 py-2 text-base font-medium text-white ${
                // Color the incorrect tile red
                wrongTileId === entry.tileId ? "bg-heart-500" : "bg-brand-500" } ${
                // Hide the used tiles, so that the grid doesn't shift
                usedTileIds.has(entry.tileId) ? "invisible" : "bg-brand-500" // Could also show the already used button greyed out, if that's useful
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
