"use client";

import type { VerseSegment } from "@/types";
import { formatVerseRangeLabel } from "@/lib/chapterContent";
import { useCheckpointField } from "@/lib/useSessionCheckpoint";
import { useCelebration } from "@/lib/useCelebration";
import { WriteRep } from "@/components/drills/WriteRep";
import { SpeakRep } from "@/components/drills/SpeakRep";
import { WordBankRound } from "@/components/drills/WordBankRound";
import { FirstLetterTypeRep } from "@/components/drills/FirstLetterTypeRep";
import { SectionCompleteOverlay } from "@/components/ui/SectionCompleteOverlay";

interface LearnVerseStageProps {
  verse: VerseSegment;
  // Every verse learned so far today, including this one — the final speak-blind stage
  // recites this whole cumulative span rather than just the verse just learned, so e.g.
  // learning Mark 1:2 ends with reciting Mark 1:1-2 together.
  cumulativeVerses: VerseSegment[];
  onComplete: () => void;
  sessionKey?: string;
}

type Phase = "speak_with_view" | "type_with_view" | "fill_1" | "fill_2" | "fill_3" | "first_letter" | "speak_blind";

const PHASES: Phase[] = [
  "speak_with_view",
  "type_with_view",
  "fill_1",
  "fill_2",
  "fill_3",
  "first_letter",
  "speak_blind",
];

const STAGE_NUMBERS: Record<Phase, number> = {
  speak_with_view: 1,
  type_with_view: 2,
  fill_1: 3,
  fill_2: 3,
  fill_3: 3,
  first_letter: 4,
  speak_blind: 5,
};

export function LearnVerseStage({ verse, cumulativeVerses, onComplete, sessionKey }: LearnVerseStageProps) {
  // Scoped by verse.id (not just the shared day-level sessionKey) so each verse in a
  // multi-verse learn day gets its own independent phase checkpoint — otherwise moving on
  // to the next verse would inherit the previous verse's leftover phase index.
  const [phaseIndex, setPhaseIndex] = useCheckpointField(
    sessionKey ? `${sessionKey}:${verse.id}` : undefined,
    "phaseIndex",
    0,
  );
  const cumulativeReference = formatVerseRangeLabel(cumulativeVerses);
  const cumulativeText = cumulativeVerses.map((entry) => entry.text).join(" ");
  const { pending, celebrate, finish } = useCelebration();

  // Every internal phase transition gets a no-text pop (the "smaller sub-sections"), except
  // the very last one — that one calls onComplete directly so LearnSection's own "New Verses
  // Learned" celebration owns the moment instead of double-popping.
  function advance() {
    const next = phaseIndex + 1;
    if (next >= PHASES.length) {
      onComplete();
    } else {
      celebrate(() => setPhaseIndex(next));
    }
  }

  if (pending) {
    return <SectionCompleteOverlay text={pending.text} onDone={finish} />;
  }

  const phase = PHASES[phaseIndex];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Stage {STAGE_NUMBERS[phase]} of 5
      </p>
      {phase === "speak_with_view" && (
        <SpeakRep
          key={phase}
          label="Speak it"
          reference={verse.reference}
          targetText={verse.text}
          reps={1}
          showVerse
          onComplete={advance}
        />
      )}
      {phase === "type_with_view" && (
        <WriteRep key={phase} verse={verse} reps={1} label="Type it out" showVerse onComplete={advance} />
      )}
      {phase === "fill_1" && <WordBankRound key={phase} verse={verse} round={1} onComplete={advance} />}
      {phase === "fill_2" && <WordBankRound key={phase} verse={verse} round={2} onComplete={advance} />}
      {phase === "fill_3" && <WordBankRound key={phase} verse={verse} round={3} onComplete={advance} />}
      {phase === "first_letter" && <FirstLetterTypeRep key={phase} verse={verse} reps={1} onComplete={advance} />}
      {phase === "speak_blind" && (
        <SpeakRep
          key={phase}
          label={cumulativeVerses.length > 1 ? "Speak everything learned so far" : "Speak the whole verse"}
          reference={cumulativeReference}
          targetText={cumulativeText}
          reps={1}
          onComplete={advance}
        />
      )}
    </div>
  );
}
