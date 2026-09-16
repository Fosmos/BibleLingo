"use client";

import type { VerseSegment } from "@/types";
import { wordOrBlank } from "@/lib/verseWords";

interface CombinedWord {
  word: string;
  verseIndex: number;
}

interface WordSlot {
  word: string;
  globalIndex: number;
}

interface VerseGroup {
  verseIndex: number;
  words: WordSlot[];
}

// Every word in the whole chain, grouped into consecutive runs sharing the same verse — so
// each verse renders on its own line, headed by its own chapter:verse, instead of every
// verse's words running together in one paragraph. Includes words not yet typed too (unlike
// the old revealed-only grouping), each carrying its own globalIndex so the render below can
// tell which ones are actually revealed.
function groupCombinedWords(combinedWords: CombinedWord[]): VerseGroup[] {
  const groups: VerseGroup[] = [];
  combinedWords.forEach((entry, globalIndex) => {
    const last = groups[groups.length - 1];
    if (last && last.verseIndex === entry.verseIndex) {
      last.words.push({ word: entry.word, globalIndex });
    } else {
      groups.push({ verseIndex: entry.verseIndex, words: [{ word: entry.word, globalIndex }] });
    }
  });
  return groups;
}

interface ReviewChainRevealedProps {
  verses: VerseSegment[];
  combinedWords: CombinedWord[];
  // How many words, counting from the very first across the whole chain, have actually been
  // typed — combinedWords[i].word for i < revealedCount is what was typed there.
  revealedCount: number;
}

// ReviewChain.tsx's own word-by-word reveal display, split out purely to keep that file under
// this codebase's 200-line cap. Shows the WHOLE chain from the start — every word already
// typed in full, every word still to come reserved as blank space in its own real position
// (see lib/verseWords.ts's wordOrBlank) — so typing a word fills it into the exact spot it was
// always going to sit in. No scroll container of its own — the chain just grows the
// LessonParchmentCard around it, same "never scroll, only grow" rule every other lesson stage
// follows.
export function ReviewChainRevealed({ verses, combinedWords, revealedCount }: ReviewChainRevealedProps) {
  const groups = groupCombinedWords(combinedWords);

  return (
    <div className="flex flex-col gap-1">
      {groups.map((group) => {
        const groupVerse = verses[group.verseIndex];
        return (
          <p key={group.verseIndex} className="text-lg leading-relaxed">
            <span className="mr-2 align-top text-sm font-semibold text-ink-muted">
              {groupVerse.chapter}:{groupVerse.verseNumber}
            </span>
            {group.words.map((slot) => (
              <span key={slot.globalIndex}>{slot.globalIndex < revealedCount ? slot.word : wordOrBlank(slot.word, false)} </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
