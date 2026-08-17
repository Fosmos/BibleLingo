"use client";

import type { MemorizationDay } from "@/types";
import { useCheckpointField } from "@/lib/useSessionCheckpoint";
import { useCelebration } from "@/lib/useCelebration";
import { LearnVerseStage } from "@/components/gamification/LearnVerseStage";
import { SectionCompleteOverlay } from "@/components/ui/SectionCompleteOverlay";

interface LearnSectionProps {
  day: MemorizationDay;
  onComplete: () => void;
  sessionKey?: string;
}

// Multi-verse learn days go one new verse at a time — each verse runs the full 5-stage
// drill on its own, then the last stage of each verse (beyond the first) recites every
// verse learned so far today together, before moving on to the next new verse.
export function LearnSection({ day, onComplete, sessionKey }: LearnSectionProps) {
  const [verseIndex, setVerseIndex] = useCheckpointField(sessionKey, "learnVerseIndex", 0);
  const { pending, celebrate, finish } = useCelebration();
  const verse = day.newVerses[verseIndex];

  if (pending) {
    return <SectionCompleteOverlay text={pending.text} onDone={finish} />;
  }
  if (!verse) return null;

  function handleVerseComplete() {
    const next = verseIndex + 1;
    if (next >= day.newVerses.length) {
      celebrate(onComplete, "New Verses Learned");
    } else {
      setVerseIndex(next);
    }
  }

  return (
    <LearnVerseStage
      key={verse.id}
      verse={verse}
      cumulativeVerses={day.newVerses.slice(0, verseIndex + 1)}
      onComplete={handleVerseComplete}
      sessionKey={sessionKey}
    />
  );
}
