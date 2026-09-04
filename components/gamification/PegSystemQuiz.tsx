"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PEG_DIGITS } from "@/lib/pegSystem";
import { playCorrectSfx, playIncorrectSfx } from "@/lib/audio";
import { TAP_SCALE } from "@/lib/motionTokens";

interface PegSystemQuizProps {
  onComplete: (score: number, total: number) => void;
}

const QUESTION_COUNT = 5;
const OPTIONS_PER_QUESTION = 4;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// A short "which consonant does this digit map to" quiz over the peg system's 0-9 table —
// one screen per question, 4 multiple-choice options, immediate feedback, then a summary.
// Digits and their distractor options are shuffled once per quiz attempt (useState
// initializer), not re-shuffled on every render.
export function PegSystemQuiz({ onComplete }: PegSystemQuizProps) {
  const [digitOrder] = useState(() => shuffle(Object.keys(PEG_DIGITS)).slice(0, QUESTION_COUNT));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const digit = digitOrder[questionIndex];
  const correctPeg = PEG_DIGITS[digit];
  const options = useMemo(() => {
    const distractorPool = Object.keys(PEG_DIGITS).filter((candidate) => candidate !== digit);
    const distractors = shuffle(distractorPool).slice(0, OPTIONS_PER_QUESTION - 1);
    return shuffle([digit, ...distractors]);
  }, [digit]);

  function handleAnswer(candidateDigit: string) {
    if (selected) return;
    setSelected(candidateDigit);
    const isCorrect = candidateDigit === digit;
    if (isCorrect) {
      playCorrectSfx();
      setScore((prev) => prev + 1);
    } else {
      playIncorrectSfx();
    }
  }

  function handleNext() {
    const next = questionIndex + 1;
    setSelected(null);
    if (next >= digitOrder.length) {
      onComplete(score, digitOrder.length);
    } else {
      setQuestionIndex(next);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-muted">
        Question {questionIndex + 1} of {digitOrder.length}
      </p>
      <p className="text-title">Which letter(s) does {digit} represent?</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((optionDigit) => {
          const isThisSelected = selected === optionDigit;
          const isCorrectOption = selected && optionDigit === digit;
          return (
            <motion.button
              key={optionDigit}
              type="button"
              whileTap={TAP_SCALE}
              disabled={selected !== null}
              onClick={() => handleAnswer(optionDigit)}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                isCorrectOption
                  ? "border-brand-500 bg-brand-500 text-white"
                  : isThisSelected
                    ? "border-heart-500 bg-heart-500 text-white"
                    : "border-line bg-white text-ink dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              }`}
            >
              {PEG_DIGITS[optionDigit].consonants}
            </motion.button>
          );
        })}
      </div>
      {selected && (
        <p className="text-sm text-ink-muted">
          {digit} = {correctPeg.consonants} — think &quot;{correctPeg.word}&quot; {correctPeg.emoji}
        </p>
      )}
      {selected && (
        <motion.button
          type="button"
          whileTap={TAP_SCALE}
          onClick={handleNext}
          className="self-start rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white"
        >
          {questionIndex + 1 >= digitOrder.length ? "Finish" : "Next"}
        </motion.button>
      )}
    </div>
  );
}
