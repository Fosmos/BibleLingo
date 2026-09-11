"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import type { VerseSegment } from "@/types";
import { useCheckpointField } from "@/lib/useSessionCheckpoint";
import { WordTypeEntry } from "@/components/drills/WordTypeEntry";
import { playLifeLossSfx } from "@/lib/audio";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { ChapterFitProbes } from "@/components/gamification/ChapterFitProbes";

interface BossBattleStageProps {
  verses: VerseSegment[];
  // "fullWord" for the whole-path capstone boss battle; "firstLetter" for a chapter or
  // section boss battle (book mode) — see WordTypeEntry.tsx.
  mode: "fullWord" | "firstLetter";
  // Defaults to 5 (a single chapter/verse boss battle); the 8-chapter section boss battle
  // passes 20, since it's a much longer recitation to get through in one attempt.
  lives?: number;
  onComplete: () => void;
  sessionKey?: string;
  // The reading view's own real page layout (see lib/useChapterReadingLayout.ts /
  // lib/useChapterScopedReadingLayout.ts) — computed once by DaySessionController.tsx (this
  // stage's only caller) and rendered once here (its own ChapterFitProbes set, matching the
  // "once per lesson, not once per stage/verse" convention every other layout caller follows).
  layout: ChapterReadingLayout;
}

const DEFAULT_LIVES_PER_ATTEMPT = 5;

export function BossBattleStage({ verses, mode, lives: livesPerAttempt = DEFAULT_LIVES_PER_ATTEMPT, onComplete, sessionKey, layout }: BossBattleStageProps) {
  // Lives/attempt reset fresh on resume even though verseIndex is checkpointed — leaving
  // mid-attempt and coming back later shouldn't preserve a nearly-lost attempt's life count.
  const [verseIndex, setVerseIndex] = useCheckpointField(sessionKey, "verseIndex", 0);
  const [lives, setLives] = useState(livesPerAttempt);
  const [attempt, setAttempt] = useState(0);
  const [justRestarted, setJustRestarted] = useState(false);
  const verse = verses[verseIndex];
  // Destructured into plain local bindings before the JSX below — see LessonChrome.tsx's own
  // identical comment on why (this codebase's react-hooks/refs lint rule).
  const { bodyTopRef, probeContainerRef, pages, fillHeightPx, dayNumberByVerse, todaysVerseNumbers, completedDays, locationTags, iconTags, pegActive } =
    layout;

  function handleVerseComplete() {
    const next = verseIndex + 1;
    if (next >= verses.length) {
      onComplete();
    } else {
      setJustRestarted(false);
      setVerseIndex(next);
    }
  }

  function handleMistake() {
    const remaining = lives - 1;
    if (remaining <= 0) {
      playLifeLossSfx();
      setLives(livesPerAttempt);
      setVerseIndex(0);
      setAttempt((prev) => prev + 1);
      setJustRestarted(true);
    } else {
      setLives(remaining);
    }
  }

  if (!verse) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-heart-600">
          Boss Battle <InfoTip text={INFO_TIPS.bossBattleStage} />
        </p>
        <div className="flex max-w-40 flex-wrap justify-end gap-1" aria-label={`${lives} of ${livesPerAttempt} lives remaining`}>
          {Array.from({ length: livesPerAttempt }).map((_, index) => (
            <Heart
              key={index}
              size={18}
              className={index < lives ? "fill-heart-500 text-heart-500" : "fill-transparent text-ink-muted dark:text-zinc-700"}
            />
          ))}
        </div>
      </div>
      {justRestarted && (
        <p className="text-sm font-medium text-heart-600">Out of lives — starting the boss battle over from the beginning.</p>
      )}
      <p className="text-sm text-ink-muted">
        Verse {verseIndex + 1} of {verses.length}
      </p>
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
      <WordTypeEntry
        key={`${verse.id}-${attempt}`}
        verse={verse}
        mode={mode}
        onMistake={handleMistake}
        onComplete={handleVerseComplete}
        layout={layout}
      />
    </div>
  );
}
