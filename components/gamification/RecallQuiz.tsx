"use client";

import { useCallback, useEffect, useState } from "react";
import type { VerseSegment } from "@/types";
import { ensureChapterLoaded } from "@/lib/bibleApiClient";
import { formatVerseSpanLabel } from "@/lib/chapterContent";
import { useHideTabBarWhile } from "@/lib/useHideTabBarWhile";
import { useReportSheetStage } from "@/lib/useReportSheetStage";
import { useEmbeddedSenseCardOverride } from "@/lib/useEmbeddedSenseCardOverride";
import { useWholeChapterReadingLayout } from "@/lib/useWholeChapterReadingLayout";
import { pickRecall, type RecallItem, type RecallMode } from "@/lib/recallQuiz";
import { ReviewChain } from "@/components/drills/ReviewChain";
import { PathLessonPage } from "@/components/gamification/PathLessonPage";
import { RecallReferenceQuestion } from "@/components/gamification/RecallReferenceQuestion";
import { FetchLoading } from "@/components/ui/FetchStatus";

interface RecallQuizProps {
  pool: RecallItem[];
  // "Your Bible" or a book's name — what the quiz is drawn from.
  scopeLabel: string;
  onClose: () => void;
}

// The Path tab's Recall Quiz, on a lesson page (PathLessonPage.tsx) so a verse looks just as it
// does in a lesson: a random verse you know, either as its reference (type the verse by first
// letters — ReviewChain, scored like a review) or as its text (enter the reference in its blocks
// — RecallReferenceQuestion.tsx). Practice only — it never touches spaced review.
export function RecallQuiz({ pool, scopeLabel, onClose }: RecallQuizProps) {
  useHideTabBarWhile(true);
  const [question, setQuestion] = useState<{ item: RecallItem; mode: RecallMode } | null>(() => pickRecall(pool, null));
  // The question's whole chapter (the verse zone's page and ghost lines), and the verse itself.
  const [chapter, setChapter] = useState<{ verses: VerseSegment[]; verse: VerseSegment } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState({ right: 0, asked: 0 });
  const [fillHeightPx, columnWidthPx] = useEmbeddedSenseCardOverride(true);
  const layout = useWholeChapterReadingLayout(chapter?.verses ?? NO_VERSES, fillHeightPx, columnWidthPx);
  useReportSheetStage({ label: `Recall quiz · ${scopeLabel} · ${score.right}/${score.asked}`, reference: "", step: 0, steps: 1 }, true);

  useEffect(() => {
    if (!question) return;
    let cancelled = false;
    const { item } = question;
    ensureChapterLoaded(item.book, item.chapter, item.version)
      .then((verses) => {
        if (cancelled) return;
        const found = verses.find((candidate) => candidate.verseNumber === item.verseNumber && candidate.text.trim());
        if (found) setChapter({ verses, verse: found });
        else setError("Couldn't find that verse.");
      })
      .catch(() => !cancelled && setError("Couldn't load that verse."));
    return () => {
      cancelled = true;
    };
  }, [question]);

  const next = useCallback(() => {
    setChapter(null);
    setError(null);
    setQuestion((previous) => pickRecall(pool, previous?.item ?? null));
  }, [pool]);
  const answered = (correct: boolean) => setScore((prev) => ({ right: prev.right + (correct ? 1 : 0), asked: prev.asked + 1 }));
  const verse = chapter?.verse;

  return (
    <PathLessonPage onClose={onClose}>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 pt-3">
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
            label={`Type ${formatVerseSpanLabel(verse.book, verse.chapter, verse.verseNumber, verse.verseNumber)}`}
            verses={[verse]}
            layout={layout}
            restartOnMistake={false}
            onComplete={(accuracy) => {
              answered(accuracy >= 90);
              next();
            }}
          />
        )}
        {question && verse && question.mode === "reference" && (
          <RecallReferenceQuestion key={`${verse.id}:reference`} verse={verse} layout={layout} onAnswered={answered} onNext={next} />
        )}
      </div>
    </PathLessonPage>
  );
}

const NO_VERSES: VerseSegment[] = [];
