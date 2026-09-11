"use client";

import { useMemo, useState } from "react";
import type { VerseSegment, WordDiffToken } from "@/types";
import { playCorrectSfx, playIncorrectSfx } from "@/lib/audio";
import { tokenizeVerseWords, firstWordCharacter } from "@/lib/verseWords";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import { ReferenceNumberEntry } from "@/components/drills/ReferenceNumberEntry";
import { ReviewChainResult } from "@/components/drills/ReviewChainResult";
import { ReviewChainHint } from "@/components/drills/ReviewChainHint";
import { ReviewChainParchment } from "@/components/drills/ReviewChainParchment";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { LessonParchmentCard } from "@/components/gamification/LessonParchmentCard";
import { LessonControlBar } from "@/components/gamification/LessonControlBar";

interface ReviewChainProps {
  verses: VerseSegment[];
  onComplete: (accuracy: number) => void;
  label?: string;
  // See ReviewChainParchment.tsx — when set, `verses` render inline on the Learn flow's own
  // real reading-view page instead of the standalone layout every other caller still gets.
  layout?: ChapterReadingLayout;
}

interface CombinedWord {
  word: string;
  verseIndex: number;
}

const REFERENCE_PATTERN = /^(\d+):(\d+)$/;

function buildCombinedWords(verses: VerseSegment[]): CombinedWord[] {
  return verses.flatMap((verse, verseIndex) => tokenizeVerseWords(verse.text).map((word) => ({ word, verseIndex })));
}

export function ReviewChain({ verses, onComplete, label = "Review", layout }: ReviewChainProps) {
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
  // Two-step hint escalation: reveal just the next letter first (still requires clicking
  // through to reveal the word), rather than jumping straight to the word — a lighter-cost
  // assist than typing it themselves, but still counted as a miss for accuracy.
  const [hintLetterShown, setHintLetterShown] = useState(false);

  const currentWord = combinedWords[wordIndex];
  const currentVerse = currentWord ? verses[currentWord.verseIndex] : null;
  const referenceMatch = currentWord?.word.match(REFERENCE_PATTERN);

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
      <ReviewChainResult
        label={label}
        accuracy={accuracy}
        totalWords={totalWords}
        wrongCount={wrongWordIndices.size}
        mistakeTokens={mistakeTokens}
        onComplete={() => onComplete(accuracy)}
      />
    );
  }

  if (!currentWord) return null;

  const chainParchment = (
    <ReviewChainParchment
      verses={verses}
      combinedWords={combinedWords}
      revealedCount={revealedWords.length}
      currentVerse={currentVerse}
      layout={layout}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      {!layout && (
        <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
          {label} <InfoTip text={INFO_TIPS.reviewChain} />
        </p>
      )}
      {layout ? chainParchment : <LessonParchmentCard>{chainParchment}</LessonParchmentCard>}

      <LessonControlBar dockRef={layout?.dockRef}>
        {layout && <p className="self-center text-caption font-semibold uppercase tracking-wide text-brand-500">{label}</p>}
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
            <ReviewChainHint
              firstLetter={firstWordCharacter(currentWord.word)}
              hintLetterShown={hintLetterShown}
              onShowLetter={() => setHintLetterShown(true)}
              onRevealWord={() => {
                setWrongWordIndices((prev) => new Set(prev).add(wordIndex));
                restartCurrentVerse(`That word was "${currentWord.word}" — restarting this verse from the beginning.`);
              }}
            />
          </div>
        )}
        <AutoCompleteButton onClick={() => onComplete(100)} />
      </LessonControlBar>
    </div>
  );
}
