"use client";

import { Mic, MicOff, Square } from "lucide-react";
import { motion } from "framer-motion";
import type { VerseSegment } from "@/types";
import type { VerseAccuracy } from "@/lib/verseAccuracyBreakdown";
import { useFirstLetterSpeaking } from "@/lib/useFirstLetterSpeaking";
import { TAP_SCALE } from "@/lib/motionTokens";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { FirstLetterMultiVersePageCard } from "@/components/drills/FirstLetterMultiVersePageCard";
import { LessonControlBar } from "@/components/gamification/LessonControlBar";

interface FirstLetterSpeakRepProps {
  verse: VerseSegment;
  onComplete: (hadMistake: boolean, accuracy: number) => void;
  verseMarkers?: Record<number, number>;
  onVerseAccuracy?: (results: VerseAccuracy[]) => void;
  // SRS review's real-page rendering (see SrsEntityRecall.tsx). Every real verse `verse` (the
  // combined synthetic verse this component's own speaking state is keyed to) was joined from,
  // rendered on the SAME real reading-view page the rest of the app uses (see
  // FirstLetterMultiVersePageCard.tsx).
  layout: ChapterReadingLayout;
  verses: VerseSegment[];
  // Moves Auto-complete beside the View First Letters/View Verse pair (see
  // LessonControlBar.tsx's own `verseViewExtra`) instead of its usual spot below the mic button.
  moveAutoCompleteToVerseView?: boolean;
}

// SRS review's speak-mode alternative to FirstLetterTypeRep — same "reveal by first letter"
// box, same accuracy/wrongWordIndices scoring contract, but a word reveals by being SPOKEN
// instead of typed (see lib/useFirstLetterSpeaking.ts for the reveal/scoring logic itself;
// this component is just its render, matching the "hook owns behavior, component renders"
// split FirstLetterTypeRep.tsx already follows). SRS review's own sole consumer (see
// SrsEntityRecall.tsx): never restarts on a mistake, and has no per-letter mistake hint to
// show (a spoken miss is only ever discovered once the whole attempt is scored).
export function FirstLetterSpeakRep({ verse, onComplete, verseMarkers, onVerseAccuracy, layout, verses, moveAutoCompleteToVerseView }: FirstLetterSpeakRepProps) {
  const speaking = useFirstLetterSpeaking({ verse, verseMarkers, onComplete, onVerseAccuracy });
  const showFallback = !speaking.supported || speaking.permissionDenied || !speaking.isSecure;
  // The ONE real verse currently being recalled, so View First Letters/View Verse (see
  // LessonControlBar.tsx's own `verseText`) peek at just that verse instead of the whole
  // entity's combined range.
  const activeRealVerse = verses.find((candidate) => candidate.verseNumber === speaking.currentVerseNumber) ?? verses[0];

  return (
    <div className="flex flex-col gap-6">
      <FirstLetterMultiVersePageCard layout={layout} verses={verses} revealedCount={speaking.revealedWords.length} currentVerseNumber={speaking.currentVerseNumber} />
      <LessonControlBar
        dockRef={layout.dockRef}
        verseText={activeRealVerse?.text ?? verse.text}
        verseViewExtra={moveAutoCompleteToVerseView ? <AutoCompleteButton onClick={() => onComplete(false, 100)} /> : undefined}
      >
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
          </div>
        )}
        {!moveAutoCompleteToVerseView && <AutoCompleteButton onClick={() => onComplete(false, 100)} />}
      </LessonControlBar>
    </div>
  );
}
