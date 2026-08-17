"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import type { VerseSegment } from "@/types";
import { useCheckpointField } from "@/lib/useSessionCheckpoint";
import { WordTypeEntry } from "@/components/drills/WordTypeEntry";
import { playLifeLossSfx } from "@/lib/audio";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

interface BossBattleStageProps {
  verses: VerseSegment[];
  onComplete: () => void;
  sessionKey?: string;
}

const LIVES_PER_ATTEMPT = 5;

export function BossBattleStage({ verses, onComplete, sessionKey }: BossBattleStageProps) {
  // Lives/attempt reset fresh on resume even though verseIndex is checkpointed — leaving
  // mid-attempt and coming back later shouldn't preserve a nearly-lost attempt's life count.
  const [verseIndex, setVerseIndex] = useCheckpointField(sessionKey, "verseIndex", 0);
  const [lives, setLives] = useState(LIVES_PER_ATTEMPT);
  const [attempt, setAttempt] = useState(0);
  const [justRestarted, setJustRestarted] = useState(false);
  const verse = verses[verseIndex];

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
      setLives(LIVES_PER_ATTEMPT);
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
        <div className="flex gap-1" aria-label={`${lives} of ${LIVES_PER_ATTEMPT} lives remaining`}>
          {Array.from({ length: LIVES_PER_ATTEMPT }).map((_, index) => (
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
      <WordTypeEntry key={`${verse.id}-${attempt}`} verse={verse} onMistake={handleMistake} onComplete={handleVerseComplete} />
    </div>
  );
}
