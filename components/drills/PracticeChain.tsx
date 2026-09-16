"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { useCheckpointField } from "@/lib/useSessionCheckpoint";
import { TAP_SCALE } from "@/lib/motionTokens";
import { WordTypeEntry } from "@/components/drills/WordTypeEntry";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { ChapterFitProbes } from "@/components/gamification/ChapterFitProbes";

interface PracticeChainProps {
  verses: VerseSegment[];
  onExit: () => void;
  sessionKey?: string;
  // "Practice" (default, boss battles) or "Review" (a completed learn lesson's own verses —
  // see DayCircle.tsx/PracticeLoader.tsx) — same drill either way, just matches whichever
  // button the reader tapped to get here.
  label?: string;
  // "fullWord" (default) for Practice — mirrors the real Boss Battle's own word-for-word
  // typing, since this is meant as prep for it. "firstLetter" for Review (a completed learn
  // lesson's own verses, tapped from the reading view) — a lighter, faster recall check, same
  // mechanic every other review surface in this app (Vespers, SRS, chapter review) uses.
  mode?: "fullWord" | "firstLetter";
  // The reading view's own real page layout (see lib/useChapterScopedReadingLayout.ts) —
  // computed once by this component's own callers (PracticeLoader.tsx/
  // InPlaceLessonSession.tsx) and rendered once here, matching the "once per lesson, not once
  // per verse" convention every other layout caller follows.
  layout: ChapterReadingLayout;
}

// A low-stakes companion to the boss battle: same word-for-word typing, but a mistake just
// flags the verse as missed rather than costing anything — at the end of that verse the
// user chooses to redo it or move on. Meant to be revisited anytime, before a boss battle
// attempt as prep or after one for upkeep. Leaving early (Exit practice) keeps the
// verseIndex checkpoint so coming back resumes here — it's only cleared on genuinely
// finishing every verse, since there's nothing left to resume at that point.
export function PracticeChain({ verses, onExit, sessionKey, label = "Practice", mode = "fullWord", layout }: PracticeChainProps) {
  const [verseIndex, setVerseIndex] = useCheckpointField(sessionKey, "verseIndex", 0);
  const clearSessionCheckpoint = useProgressStore((state) => state.clearSessionCheckpoint);
  const [attempt, setAttempt] = useState(0);
  const [awaitingRedoChoice, setAwaitingRedoChoice] = useState(false);
  const [donePracticing, setDonePracticing] = useState(false);

  const verse = verses[verseIndex];
  // Destructured into plain local bindings before the JSX below — see LessonChrome.tsx's own
  // identical comment on why (this codebase's react-hooks/refs lint rule).
  const { bodyTopRef, probeContainerRef, pages, fillHeightPx, dayNumberByVerse, todaysVerseNumbers, completedDays, locationTags, iconTags, pegActive } =
    layout;

  function startVerse(index: number) {
    setVerseIndex(index);
    setAttempt((prev) => prev + 1);
    setAwaitingRedoChoice(false);
  }

  function advanceToNextVerse() {
    const next = verseIndex + 1;
    if (next >= verses.length) {
      if (sessionKey) clearSessionCheckpoint(sessionKey);
      setDonePracticing(true);
    } else {
      startVerse(next);
    }
  }

  function handleVerseComplete(hadMistake: boolean) {
    if (hadMistake) {
      setAwaitingRedoChoice(true);
    } else {
      advanceToNextVerse();
    }
  }

  if (donePracticing) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-title">{label} complete</p>
        <p className="text-sm text-ink-muted">Come back anytime to {label.toLowerCase()} again.</p>
        <div className="flex gap-3">
          <motion.button
            type="button"
            whileTap={TAP_SCALE}
            onClick={() => startVerse(0)}
            className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white"
          >
            {label} again
          </motion.button>
          <button type="button" onClick={onExit} className="text-sm font-medium text-ink-muted hover:underline">
            Done
          </button>
        </div>
      </div>
    );
  }

  if (!verse) return null;

  if (awaitingRedoChoice) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-sm font-medium text-heart-600">You missed a word in {verse.reference}.</p>
        <div className="flex gap-3">
          <motion.button
            type="button"
            whileTap={TAP_SCALE}
            onClick={() => startVerse(verseIndex)}
            className="rounded-full bg-heart-500 px-5 py-2 text-sm font-semibold text-white"
          >
            Redo this verse
          </motion.button>
          <motion.button
            type="button"
            whileTap={TAP_SCALE}
            onClick={advanceToNextVerse}
            className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white"
          >
            {verseIndex + 1 >= verses.length ? "Finish" : "Continue"}
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
          {label} <InfoTip text={INFO_TIPS.practiceChain} />
        </p>
        <p className="text-sm text-ink-muted">
          Verse {verseIndex + 1} of {verses.length}
        </p>
      </div>
      <div ref={bodyTopRef} />
      <ChapterFitProbes
        ref={probeContainerRef}
        pages={pages}
        fillHeightPx={fillHeightPx}
        dayNumberByVerse={dayNumberByVerse}
        todaysVerseNumbers={todaysVerseNumbers}
        completedDays={completedDays}
        locationTags={locationTags}
        iconTags={iconTags}
        pegActive={pegActive}
      />
      <WordTypeEntry key={`${verse.id}-${attempt}`} verse={verse} mode={mode} onComplete={handleVerseComplete} layout={layout} />
      <button type="button" onClick={onExit} className="self-start text-sm font-medium text-ink-muted hover:underline">
        Exit {label.toLowerCase()}
      </button>
    </div>
  );
}
