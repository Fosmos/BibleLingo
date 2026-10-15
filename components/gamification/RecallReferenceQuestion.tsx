"use client";

import { useState, type FormEvent } from "react";
import type { VerseSegment } from "@/types";
import { parseToSenseLines } from "@/lib/senseLines";
import { formatChapterLabel } from "@/lib/chapterContent";
import { referenceMatches, type RecallItem } from "@/lib/recallQuiz";

interface RecallReferenceQuestionProps {
  item: RecallItem;
  verse: VerseSegment;
  onAnswered: (correct: boolean) => void;
  onNext: () => void;
}

// A Recall Quiz question shown as the verse: type where it's from. Forgiving about how the
// reference is written (lib/recallQuiz.ts's referenceMatches); shows the answer either way.
export function RecallReferenceQuestion({ item, verse, onAnswered, onNext }: RecallReferenceQuestionProps) {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<boolean | null>(null);
  const reference = `${formatChapterLabel(item.book, item.chapter)}:${item.verseNumber}`;

  function check(event: FormEvent) {
    event.preventDefault();
    if (result !== null || !answer.trim()) return;
    const correct = referenceMatches(answer, item);
    setResult(correct);
    onAnswered(correct);
  }

  return (
    <div className="flex flex-col gap-5">
      <span className="text-xs font-extrabold uppercase tracking-[.08em] text-sage-800 dark:text-sage-300">Where is this from?</span>
      <div className="flex flex-col gap-2.5 rounded-[28px] bg-[#FEFDFB] p-5 text-[17px] font-medium leading-[1.5] text-ink shadow-organic-sm dark:bg-zinc-900 dark:text-zinc-100">
        {parseToSenseLines(verse.text).map((line, index) => (
          <p key={index} className="pl-4 -indent-4">
            {line}
          </p>
        ))}
      </div>
      <form onSubmit={check} className="flex gap-2">
        <input
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          disabled={result !== null}
          autoFocus
          autoCapitalize="words"
          placeholder="e.g. Titus 1:6"
          aria-label="Verse reference"
          className="min-w-0 flex-1 rounded-full border-2 border-sand-300 bg-[#FEFDFB] px-4 py-3 text-base font-semibold text-ink outline-none focus:border-brand-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        {result === null && (
          <button type="submit" className="rounded-full bg-brand-500 px-5 text-sm font-extrabold text-white hover:bg-brand-600 disabled:opacity-50" disabled={!answer.trim()}>
            Check
          </button>
        )}
      </form>
      {result !== null && (
        <div className={`flex items-center gap-3 rounded-[24px] px-5 py-4 ${result ? "bg-sage-100 text-sage-900" : "bg-brand-100 text-brand-900"}`}>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-xs font-extrabold uppercase tracking-[.06em]">{result ? "Correct" : "Not quite"}</span>
            <span className="font-heading text-xl leading-tight">{reference}</span>
          </div>
          <button type="button" onClick={onNext} className="rounded-full bg-ink px-5 py-2.5 text-sm font-extrabold text-paper dark:bg-zinc-100 dark:text-zinc-900">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
