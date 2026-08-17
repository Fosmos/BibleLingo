"use client";

import { useMemo } from "react";
import type { VerseSegment } from "@/types";
import { tokenizeVerseWords } from "@/lib/verseWords";
import type { MasteryLevelConfig } from "@/lib/masteryMode";
import { useMasteryChase } from "@/lib/useMasteryChase";
import { MasteryTrack } from "@/components/drills/MasteryTrack";
import { MasteryVerseCard } from "@/components/drills/MasteryVerseCard";
import { MasteryKeyboard } from "@/components/drills/MasteryKeyboard";
import { ReferenceNumberEntry } from "@/components/drills/ReferenceNumberEntry";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

interface MasteryChaseRoundProps {
  verse: VerseSegment;
  levelConfig: MasteryLevelConfig;
  onComplete: (cleared: boolean) => void;
}

// The core Mastery Mode mechanic: type the first letter of each word to propel a runner
// across the dried Red Sea bed, ahead of pursuing chariots. The runner's own position is a
// continuously-simulated momentum value (lib/masteryPhysics.ts, driven by lib/useMasteryChase.ts)
// that glides toward each newly-revealed word on an impulse from the correct keystroke, then
// decays through friction if the player pauses — so hesitating costs ground even without an
// outright mistake. A wrong letter never sets the player back; it jumps the chariots forward
// instead, and the same word must still be answered correctly. Reports only a pass/fail
// boolean upward, same contract as every other drill component.
export function MasteryChaseRound({ verse, levelConfig, onComplete }: MasteryChaseRoundProps) {
  const words = useMemo(() => tokenizeVerseWords(verse.text), [verse.text]);
  const chase = useMasteryChase({ words, levelConfig, onComplete });

  if (!chase.currentWord && chase.phase === "playing") return null;

  return (
    <div className="flex min-h-[65vh] flex-col gap-3">
      <div>
        <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
          {levelConfig.label} — {levelConfig.tagline} <InfoTip text={INFO_TIPS.masteryChaseRound} />
        </p>
        <p className="text-title">{verse.reference}</p>
      </div>
      <div className="flex flex-[3] flex-col gap-2">
        <MasteryTrack
          playerPercent={chase.playerPercent}
          chaserPercent={chase.chaserPercent}
          advanceTick={chase.advanceTick}
          surgeTick={chase.surgeTick}
          gapWords={chase.gapWords}
        />
        {chase.phase === "cleared" && (
          <p className="text-center text-sm font-semibold text-brand-600">You reached the far shore!</p>
        )}
        {chase.phase === "caught" && <p className="text-center text-sm font-semibold text-heart-600">Caught! Give it another go.</p>}
      </div>
      {chase.phase === "playing" && chase.currentWord && (
        <div className="flex flex-1 flex-col justify-end gap-3">
          <MasteryVerseCard words={words} wordIndex={chase.wordIndex} />
          {chase.referenceMatch ? (
            <ReferenceNumberEntry
              key={chase.currentWord}
              chapter={chase.referenceMatch[1]}
              verse={chase.referenceMatch[2]}
              onDone={() => chase.revealCurrentWord(false)}
              onMistake={chase.punishMistake}
            />
          ) : (
            <MasteryKeyboard onKeyPress={chase.handleLetterPress} />
          )}
          {!chase.referenceMatch && chase.showError && chase.wrongLetterExpected && (
            <p className="text-center text-sm font-medium text-heart-600">
              Not quite — the next word starts with &quot;{chase.wrongLetterExpected}&quot;. The chariots gained ground!
            </p>
          )}
          <AutoCompleteButton onClick={chase.forceClear} />
        </div>
      )}
    </div>
  );
}
