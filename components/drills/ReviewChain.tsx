"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { VerseSegment, WordDiffToken } from "@/types";
import { playCorrectSfx, playIncorrectSfx } from "@/lib/audio";
import { TAP_SCALE } from "@/lib/motionTokens";
import { tokenizeVerseWords, firstWordCharacter } from "@/lib/verseWords";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import { MistakeDiff } from "@/components/drills/MistakeDiff";
import { ReferenceNumberEntry } from "@/components/drills/ReferenceNumberEntry";
import { VerseReferenceHeader } from "@/components/ui/VerseReferenceHeader";

interface ReviewChainProps {
  verses: VerseSegment[];
  onComplete: (accuracy: number) => void;
  label?: string;
}

interface CombinedWord {
  word: string;
  verseIndex: number;
}

const REFERENCE_PATTERN = /^(\d+):(\d+)$/;

function buildCombinedWords(verses: VerseSegment[]): CombinedWord[] {
  return verses.flatMap((verse, verseIndex) => tokenizeVerseWords(verse.text).map((word) => ({ word, verseIndex })));
}

interface RevealedVerseGroup {
  verseIndex: number;
  words: string[];
}

// revealedWords is always exactly the first N words of combinedWords, in the same order
// (see revealCurrentWord/restartCurrentVerse below) — so combinedWords[i].verseIndex is
// always revealedWords[i]'s own verse. Grouped into consecutive runs so each verse renders
// on its own line, headed by its own chapter:verse, instead of every verse's words running
// together in one paragraph.
function groupRevealedWords(revealedWords: string[], combinedWords: CombinedWord[]): RevealedVerseGroup[] {
  const groups: RevealedVerseGroup[] = [];
  revealedWords.forEach((word, index) => {
    const verseIndex = combinedWords[index].verseIndex;
    const last = groups[groups.length - 1];
    if (last && last.verseIndex === verseIndex) {
      last.words.push(word);
    } else {
      groups.push({ verseIndex, words: [word] });
    }
  });
  return groups;
}

export function ReviewChain({ verses, onComplete, label = "Review" }: ReviewChainProps) {
  const combinedWords = useMemo(() => buildCombinedWords(verses), [verses]);
  const totalWords = combinedWords.length;

  const [wordIndex, setWordIndex] = useState(0);
  const [revealedWords, setRevealedWords] = useState<string[]>([]);
  const [letterInput, setLetterInput] = useState("");
  // Shown briefly after a mistake bounces the reader back to this verse's first word —
  // cleared as soon as the next word is typed correctly. Non-null whenever a restart just
  // happened; its text says why (and, for a revealed word, what the word actually was, since
  // restarting immediately would otherwise never show it).
  const [restartNotice, setRestartNotice] = useState<string | null>(null);
  const [wrongWordIndices, setWrongWordIndices] = useState<Set<number>>(new Set());
  const [finished, setFinished] = useState(false);
  const [showMistakes, setShowMistakes] = useState(false);
  // Two-step hint escalation: reveal just the next letter first (still requires clicking
  // through to reveal the word), rather than jumping straight to the word — a lighter-cost
  // assist than typing it themselves, but still counted as a miss for accuracy.
  const [hintLetterShown, setHintLetterShown] = useState(false);
  const revealedRef = useRef<HTMLDivElement>(null);

  // Keeps the input pinned near the top of the visible area instead of drifting down (and
  // eventually behind the on-screen keyboard) as a long chapter's revealed text grows — the
  // text scrolls within its own bounded box rather than pushing the rest of the layout down.
  useEffect(() => {
    revealedRef.current?.scrollTo({ top: revealedRef.current.scrollHeight });
  }, [revealedWords]);

  const currentWord = combinedWords[wordIndex];
  const currentVerse = currentWord ? verses[currentWord.verseIndex] : null;
  const referenceMatch = currentWord?.word.match(REFERENCE_PATTERN);
  const revealedGroups = useMemo(() => groupRevealedWords(revealedWords, combinedWords), [revealedWords, combinedWords]);

  function revealCurrentWord() {
    if (!currentWord) return;
    setRestartNotice(null);
    setLetterInput("");
    setHintLetterShown(false);
    setRevealedWords((prev) => [...prev, currentWord.word]);
    const next = wordIndex + 1;
    if (next >= combinedWords.length) {
      setFinished(true);
    } else {
      setWordIndex(next);
    }
  }

  // A wrong letter, a wrong reference digit, or a used hint doesn't just cost accuracy and
  // move on — it restarts THIS verse's reveal from its own first word (every earlier verse in
  // the chain stays revealed), so the review can only finish once every verse has, in the end,
  // been typed with a single clean pass. Mirrors FirstLetterTypeRep's restartOnMistake (Learn
  // flow), generalized here to "restart just the current verse" since a chain spans several.
  function restartCurrentVerse(notice: string) {
    if (!currentWord) return;
    const verseStart = combinedWords.findIndex((word) => word.verseIndex === currentWord.verseIndex);
    setRevealedWords((prev) => prev.slice(0, verseStart));
    setWordIndex(verseStart);
    setRestartNotice(notice);
    setLetterInput("");
    setHintLetterShown(false);
  }

  function handleLetterChange(value: string) {
    if (!currentWord) return;
    const expected = firstWordCharacter(currentWord.word)?.toLowerCase();
    const typed = value.toLowerCase();

    if (typed && typed === expected) {
      playCorrectSfx();
      revealCurrentWord();
    } else if (typed) {
      playIncorrectSfx();
      setWrongWordIndices((prev) => new Set(prev).add(wordIndex));
      restartCurrentVerse("Not quite — restarting this verse from the beginning.");
    }
  }

  if (finished) {
    const accuracy = Math.round(((totalWords - wrongWordIndices.size) / totalWords) * 100);
    const mistakeTokens: WordDiffToken[] = combinedWords.map((combined, index) => ({
      word: combined.word,
      correct: !wrongWordIndices.has(index),
    }));
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-caption font-semibold uppercase tracking-wide text-brand-500">{label} complete</p>
        <p className="text-title">{accuracy}% accuracy</p>
        <p className="text-sm text-ink-muted">
          {totalWords - wrongWordIndices.size} of {totalWords} words correct on the first try.
        </p>
        {wrongWordIndices.size > 0 && (
          <button
            type="button"
            onClick={() => setShowMistakes((prev) => !prev)}
            className="self-center text-sm font-medium text-brand-600 hover:underline"
          >
            {showMistakes ? "Hide mistakes" : "Review mistakes"}
          </button>
        )}
        {showMistakes && <MistakeDiff label="Words you missed the first time:" tokens={mistakeTokens} />}
        <motion.button
          type="button"
          whileTap={TAP_SCALE}
          onClick={() => onComplete(accuracy)}
          className="self-center rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white"
        >
          Continue
        </motion.button>
      </div>
    );
  }

  if (!currentWord) return null;

  return (
    <div className="flex flex-col gap-6">
      <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
        {label} <InfoTip text={INFO_TIPS.reviewChain} />
      </p>
      {currentVerse && (
        <VerseReferenceHeader
          book={currentVerse.book}
          chapter={currentVerse.chapter}
          verseNumber={currentVerse.verseNumber}
          reference={`Now in: ${currentVerse.reference}`}
          compact
        />
      )}
      <div ref={revealedRef} className="flex max-h-36 flex-col gap-1 overflow-y-auto">
        {revealedGroups.map((group) => {
          const groupVerse = verses[group.verseIndex];
          return (
            <p key={group.verseIndex} className="text-lg leading-relaxed">
              <span className="mr-2 align-top text-sm font-semibold text-ink-muted">
                {groupVerse.chapter}:{groupVerse.verseNumber}
              </span>
              {group.words.join(" ")}
            </p>
          );
        })}
      </div>
      {referenceMatch ? (
        <ReferenceNumberEntry
          key={`${wordIndex}-${currentWord.word}`}
          chapter={referenceMatch[1]}
          verse={referenceMatch[2]}
          onDone={revealCurrentWord}
          onMistake={() => {
            setWrongWordIndices((prev) => new Set(prev).add(wordIndex));
            restartCurrentVerse("Not quite — restarting this verse from the beginning.");
          }}
        />
      ) : (
        <input
          value={letterInput}
          onChange={(event) => handleLetterChange(event.target.value)}
          maxLength={1}
          autoFocus
          aria-label="Type the first letter of the next word"
          className={`w-16 rounded-xl border p-3 text-center text-xl focus:outline-none focus-visible:ring-2 dark:bg-zinc-900 ${
            restartNotice
              ? "border-heart-500 focus-visible:ring-heart-500"
              : "border-line focus-visible:ring-brand-500 dark:border-zinc-700"
          }`}
        />
      )}
      {restartNotice && <p className="text-sm font-medium text-heart-600">{restartNotice}</p>}
      {!referenceMatch && (
        <div className="flex items-center gap-4">
          {!hintLetterShown ? (
            <button
              type="button"
              onClick={() => setHintLetterShown(true)}
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              Reveal next letter
            </button>
          ) : (
            <>
              <span className="text-sm text-ink-muted">
                Hint: &quot;{firstWordCharacter(currentWord.word)}&quot;
              </span>
              <button
                type="button"
                onClick={() => {
                  setWrongWordIndices((prev) => new Set(prev).add(wordIndex));
                  restartCurrentVerse(`That word was "${currentWord.word}" — restarting this verse from the beginning.`);
                }}
                className="text-sm font-medium text-brand-600 hover:underline"
              >
                Reveal word
              </button>
            </>
          )}
        </div>
      )}
      <AutoCompleteButton onClick={() => onComplete(100)} />
    </div>
  );
}
