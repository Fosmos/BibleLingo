"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { VerseSegment } from "@/types";
import { playCorrectSfx, playIncorrectSfx } from "@/lib/audio";
import { useCheckpointField } from "@/lib/useSessionCheckpoint";
import { tokenizeVerseWords, firstWordCharacter } from "@/lib/verseWords";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import { ReferenceNumberEntry } from "@/components/drills/ReferenceNumberEntry";

interface FirstLetterTypeRepProps {
  verse: VerseSegment;
  reps: number;
  onComplete: (hadMistake: boolean) => void;
  // When provided, checkpoints wordIndex so leaving mid-verse and coming back resumes here
  // instead of restarting — used by SRS review, which has no coarser "which stage" checkpoint
  // to fall back on the way the Learn section's phase index does.
  sessionKey?: string;
}

const REFERENCE_PATTERN = /^(\d+):(\d+)$/;

export function FirstLetterTypeRep({ verse, reps, onComplete, sessionKey }: FirstLetterTypeRepProps) {
  const words = useMemo(() => tokenizeVerseWords(verse.text), [verse.text]);
  const [completedReps, setCompletedReps] = useState(0);
  const [wordIndex, setWordIndex] = useCheckpointField(sessionKey, "wordIndex", 0);
  // Derived from wordIndex rather than tracked separately — the words are already known
  // up front, so "what's been revealed" is always exactly the words before the current one.
  const revealedWords = words.slice(0, wordIndex);
  const [letterInput, setLetterInput] = useState("");
  const [showError, setShowError] = useState(false);
  const [wrongLetterExpected, setWrongLetterExpected] = useState<string | null>(null);
  // Tracks whether any attempt across this component's lifetime (all reps) missed — read
  // synchronously via ref rather than state so the value reported to onComplete on the very
  // next successful attempt is never stale.
  const hadMistakeRef = useRef(false);
  const revealedRef = useRef<HTMLDivElement>(null);

  // Keeps the input pinned near the top of the visible area instead of drifting down (and
  // eventually behind the on-screen keyboard) as a long verse's revealed text grows — the
  // text scrolls within its own bounded box rather than pushing the rest of the layout down.
  useEffect(() => {
    revealedRef.current?.scrollTo({ top: revealedRef.current.scrollHeight });
  }, [wordIndex]);

  const currentWord = words[wordIndex];
  const referenceMatch = currentWord?.match(REFERENCE_PATTERN);

  function revealCurrentWord() {
    if (!currentWord) return;
    setShowError(false);
    setWrongLetterExpected(null);
    setLetterInput("");
    const nextWordIndex = wordIndex + 1;
    if (nextWordIndex >= words.length) {
      const nextRep = completedReps + 1;
      if (nextRep >= reps) {
        onComplete(hadMistakeRef.current);
      } else {
        setCompletedReps(nextRep);
        setWordIndex(0);
      }
    } else {
      setWordIndex(nextWordIndex);
    }
  }

  // A mistake restarts this rep's verse reveal from word 1 rather than just retrying the
  // missed word — "resetting the section" the same way a wrong tap in WordBankRound
  // restarts that round from its first blank.
  function handleLetterChange(value: string) {
    if (!currentWord) return;
    const expected = firstWordCharacter(currentWord)?.toLowerCase();
    const typed = value.toLowerCase();

    if (typed && typed === expected) {
      playCorrectSfx();
      revealCurrentWord();
    } else if (typed) {
      playIncorrectSfx();
      setShowError(true);
      setWrongLetterExpected(firstWordCharacter(currentWord) ?? "");
      setLetterInput("");
      hadMistakeRef.current = true;
      setWordIndex(0);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
          Type it by first letter <InfoTip text={INFO_TIPS.firstLetterTypeRep} />
        </p>
        <p className="text-title">{verse.reference}</p>
      </div>
      <p className="text-sm text-ink-muted">
        Rep {completedReps + 1} of {reps}
      </p>
      <div ref={revealedRef} className="max-h-36 min-h-8 overflow-y-auto">
        <p className="text-lg leading-relaxed">{revealedWords.join(" ")}</p>
      </div>
      {referenceMatch ? (
        <ReferenceNumberEntry
          key={currentWord}
          chapter={referenceMatch[1]}
          verse={referenceMatch[2]}
          onDone={revealCurrentWord}
          onMistake={() => {
            hadMistakeRef.current = true;
            setWordIndex(0);
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
            showError
              ? "border-heart-500 focus-visible:ring-heart-500"
              : "border-line focus-visible:ring-brand-500 dark:border-zinc-700"
          }`}
        />
      )}
      {!referenceMatch && showError && wrongLetterExpected && (
        <p className="text-sm font-medium text-heart-600">
          Not quite — the next word starts with &quot;{wrongLetterExpected}&quot;.
        </p>
      )}
      <AutoCompleteButton onClick={() => onComplete(hadMistakeRef.current)} />
    </div>
  );
}
