"use client";

import type { ReactNode } from "react";
import { Mic, MicOff, Square } from "lucide-react";
import { motion } from "framer-motion";
import type { VerseSegment } from "@/types";
import type { VerseAccuracy } from "@/lib/verseAccuracyBreakdown";
import { useFirstLetterSpeaking } from "@/lib/useFirstLetterSpeaking";
import { TAP_SCALE } from "@/lib/motionTokens";
import { RevealedWordsList } from "@/components/drills/RevealedWordsList";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import { VerseContextLine } from "@/components/ui/VerseContextLine";
import { VerseReferenceHeader } from "@/components/ui/VerseReferenceHeader";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { FirstLetterMultiVersePageCard } from "@/components/drills/FirstLetterMultiVersePageCard";
import { LessonControlBar } from "@/components/gamification/LessonControlBar";

interface FirstLetterSpeakRepProps {
  verse: VerseSegment;
  onComplete: (hadMistake: boolean, accuracy: number) => void;
  previousVerse?: VerseSegment;
  nextVerse?: VerseSegment;
  verseMarkers?: Record<number, number>;
  onVerseAccuracy?: (results: VerseAccuracy[]) => void;
  allowPeekHint?: boolean;
  // SRS review's real-page rendering (see SrsEntityRecall.tsx) — set together, always. Every
  // real verse `verse` (the combined synthetic verse this component's own speaking state is
  // keyed to) was joined from, rendered on the SAME real reading-view page the rest of the app
  // uses (see FirstLetterMultiVersePageCard.tsx) instead of the plain box below.
  layout?: ChapterReadingLayout;
  verses?: VerseSegment[];
  // Extra controls (SRS review's own VerseRevealHelp "peek at the answer" trigger) rendered
  // inside this component's own control bar — see FirstLetterTypeRep.tsx's identical prop for
  // why (keeps every control inside the ONE measured/capped dock).
  extraControls?: ReactNode;
}

// SRS review's speak-mode alternative to FirstLetterTypeRep — same "reveal by first letter"
// box (see RevealedWordsList's lettersOnly), same accuracy/wrongWordIndices scoring contract,
// but a word reveals by being SPOKEN instead of typed (see lib/useFirstLetterSpeaking.ts for
// the reveal/scoring logic itself; this component is just its render, matching the "hook owns
// behavior, component renders" split FirstLetterTypeRep.tsx already follows). Scoped to SRS
// review specifically, not a general drop-in for FirstLetterTypeRep everywhere: it always
// runs lettersOnly, never restarts on a mistake, and has no per-letter mistake hint to show
// (a spoken miss is only ever discovered once the whole attempt is scored, not letter by
// letter) — the exact same restartOnMistake={false}/autoRevealLetterOnMistake={false}
// SrsEntityRecall.tsx already passes FirstLetterTypeRep for this same review context.
export function FirstLetterSpeakRep({
  verse,
  onComplete,
  previousVerse,
  nextVerse,
  verseMarkers,
  onVerseAccuracy,
  allowPeekHint,
  layout,
  verses,
  extraControls,
}: FirstLetterSpeakRepProps) {
  const speaking = useFirstLetterSpeaking({ verse, verseMarkers, onComplete, onVerseAccuracy });
  const showFallback = !speaking.supported || speaking.permissionDenied || !speaking.isSecure;

  return (
    <div className="flex flex-col gap-6">
      {!layout && (
        <div>
          <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
            Speak it by first letter <InfoTip text={INFO_TIPS.firstLetterTypeRep} />
          </p>
          <VerseReferenceHeader book={verse.book} chapter={verse.chapter} verseNumber={speaking.currentVerseNumber} reference={verse.reference} />
        </div>
      )}
      {verses && layout ? (
        <FirstLetterMultiVersePageCard
          layout={layout}
          verses={verses}
          revealedCount={speaking.revealedWords.length}
          currentVerseNumber={speaking.currentVerseNumber}
        />
      ) : (
        <>
          {previousVerse && <VerseContextLine verse={previousVerse} />}
          <div className="max-h-36 min-h-8 overflow-y-auto">
            <p className="text-lg leading-relaxed">
              <RevealedWordsList words={speaking.revealedWords} verseMarkers={verseMarkers} lettersOnly />
            </p>
          </div>
          {nextVerse && <VerseContextLine verse={nextVerse} />}
        </>
      )}
      <LessonControlBar dockRef={layout?.dockRef}>
        {layout && <p className="self-center text-caption font-semibold uppercase tracking-wide text-brand-500">Speak it by first letter</p>}
        {showFallback ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            <div className="flex items-center gap-2 font-medium">
              <MicOff size={18} className="text-amber-600 dark:text-amber-400" />
              <span>
                {!speaking.isSecure ? "HTTPS required on mobile" : speaking.permissionDenied ? "Microphone access declined" : "Speech recognition unsupported"}
              </span>
            </div>
            <p className="text-sm text-ink-muted dark:text-zinc-400">Switch back to typing in your review settings to keep going.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {!speaking.isListening ? (
              <div className="flex items-center gap-3">
                <motion.button
                  type="button"
                  whileTap={TAP_SCALE}
                  onClick={speaking.start}
                  aria-label="Start speaking"
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm hover:bg-brand-600"
                >
                  <Mic size={26} />
                </motion.button>
                <span className="text-sm text-ink-muted">Tap to recite from memory</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <motion.button
                  type="button"
                  whileTap={TAP_SCALE}
                  onClick={speaking.stop}
                  aria-label="Done speaking"
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-heart-500 text-white shadow-sm animate-pulse"
                >
                  <Square size={22} />
                </motion.button>
                <span className="text-sm text-ink-muted">Listening — words fill in as you say them</span>
              </div>
            )}
            {allowPeekHint && speaking.isListening && (
              <button type="button" onClick={speaking.peekHint} className="text-xs font-medium text-ink-muted hover:text-brand-600 hover:underline">
                Peek hint
              </button>
            )}
          </div>
        )}
        <AutoCompleteButton onClick={() => onComplete(false, 100)} />
        {extraControls}
      </LessonControlBar>
    </div>
  );
}
