"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import type { VerseSegment } from "@/types";
import { ensureChapterLoaded } from "@/lib/bibleApiClient";
import { formatChapterLabel } from "@/lib/chapterContent";
import { useHideTabBarWhile } from "@/lib/useHideTabBarWhile";
import { pickRecall, type RecallItem, type RecallMode } from "@/lib/recallQuiz";
import { ReviewChain } from "@/components/drills/ReviewChain";
import { RecallReferenceQuestion } from "@/components/gamification/RecallReferenceQuestion";
import { FetchLoading } from "@/components/ui/FetchStatus";

interface RecallQuizProps {
  pool: RecallItem[];
  // "Your Bible" or a book's name — what the quiz is drawn from.
  scopeLabel: string;
  onClose: () => void;
}

// The Path tab's Recall Quiz, over the whole screen: a random verse you know, either as its
// reference (type the verse by first letters — ReviewChain, scored like a review) or as its text
// (type the reference). Practice only — it never touches spaced review.
export function RecallQuiz({ pool, scopeLabel, onClose }: RecallQuizProps) {
  useHideTabBarWhile(true);
  const [question, setQuestion] = useState<{ item: RecallItem; mode: RecallMode } | null>(() => pickRecall(pool, null));
  const [verse, setVerse] = useState<VerseSegment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState({ right: 0, asked: 0 });

  useEffect(() => {
    if (!question) return;
    let cancelled = false;
    const { item } = question;
    ensureChapterLoaded(item.book, item.chapter, item.version)
      .then((verses) => {
        if (cancelled) return;
        const found = verses.find((candidate) => candidate.verseNumber === item.verseNumber && candidate.text.trim());
        if (found) setVerse(found);
        else setError("Couldn't find that verse.");
      })
      .catch(() => !cancelled && setError("Couldn't load that verse."));
    return () => {
      cancelled = true;
    };
  }, [question]);

  const next = useCallback(() => {
    setVerse(null);
    setError(null);
    setQuestion((previous) => pickRecall(pool, previous?.item ?? null));
  }, [pool]);
  const answered = (correct: boolean) => setScore((prev) => ({ right: prev.right + (correct ? 1 : 0), asked: prev.asked + 1 }));

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper dark:bg-zinc-950">
      <header className="flex shrink-0 items-center gap-3 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <button type="button" onClick={onClose} aria-label="Close quiz" className="flex h-9 w-9 items-center justify-center rounded-full bg-sand-200 text-sand-800 hover:bg-sand-300 dark:bg-zinc-800 dark:text-zinc-200">
          <X size={18} strokeWidth={2.75} />
        </button>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[11px] font-extrabold uppercase tracking-[.08em] text-sage-800 dark:text-sage-300">Recall quiz · {scopeLabel}</span>
          <span className="font-heading text-xl leading-tight text-ink dark:text-zinc-100">
            {question?.mode === "verse" ? `${formatChapterLabel(question.item.book, question.item.chapter)}:${question.item.verseNumber}` : "Name the verse"}
          </span>
        </div>
        <span className="rounded-full bg-sage-100 px-3 py-1 text-sm font-extrabold text-sage-900">
          {score.right}/{score.asked}
        </span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-8">
        {!question && <p className="pt-10 text-center text-ink-muted">Memorize a verse to start the quiz.</p>}
        {error && (
          <div className="flex flex-col items-center gap-3 pt-10 text-center">
            <p className="text-ink-muted">{error}</p>
            <button type="button" onClick={next} className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-extrabold text-white">
              Try another
            </button>
          </div>
        )}
        {question && !verse && !error && <FetchLoading label="Finding a verse…" />}
        {question && verse && question.mode === "verse" && (
          <ReviewChain
            key={`${verse.id}:verse`}
            label={`Type ${formatChapterLabel(question.item.book, question.item.chapter)}:${question.item.verseNumber}`}
            verses={[verse]}
            restartOnMistake={false}
            onComplete={(accuracy) => {
              answered(accuracy >= 90);
              next();
            }}
          />
        )}
        {question && verse && question.mode === "reference" && <RecallReferenceQuestion key={`${verse.id}:reference`} item={question.item} verse={verse} onAnswered={answered} onNext={next} />}
      </div>
    </div>
  );
}
