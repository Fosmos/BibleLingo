"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { locationTagKey } from "@/lib/locationTags";
import { TAP_SCALE } from "@/lib/motionTokens";
import type { WordAnnotationMap } from "@/lib/verseHighlights";
import { AnnotatedVerseWordRange } from "@/components/drills/AnnotatedVerseWordRange";
import { VersePOAInput } from "@/components/drills/VersePOAInput";
import { SceneGenerator } from "@/components/drills/SceneGenerator";
import { pegWordFor } from "@/lib/pegSystem";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { LessonWholeDayPageCard } from "@/components/gamification/LessonWholeDayPageCard";
import { LessonControlBar } from "@/components/gamification/LessonControlBar";

interface VerseOrientationSummaryRepProps {
  // Today's own real verses (see LearnSection.tsx's `realVerses`) — every one of them renders
  // in full on the SAME real reading-view page as the rest of the Learn flow (see
  // LessonWholeDayPageCard.tsx), each still carrying whatever highlights it picked up in
  // Understand (read-only here — see AnnotatedVerseWord.tsx).
  verses: VerseSegment[];
  // `verses[i]`'s own word offset within `wordAnnotations`' indexing (built against the whole
  // day's joined text — see LearnSection.tsx's own `verseOffsets`).
  verseOffsets: number[];
  wordAnnotations: WordAnnotationMap;
  onComplete: () => void;
  layout: ChapterReadingLayout;
}

// The "Visualize" stage (second half of Understand+Visualize, see VerseOrientationRep for
// the first): with the verse's structure already worked through by highlighting/annotating
// it, this step has the reader read it once more in full, then fill 5 lines — Loci (this
// verse's own location tag, if one's been added — see lib/locationTags.ts; blank otherwise)
// and Peg (the verse-number word, only shown when the peg system is on — pre-filled with
// lib/pegSystem.ts's recommendation but the reader can type their own word instead) for
// context, then their own Who and Action and an optional extra detail — all anchored to
// `verses[0]`, today's own FIRST real verse (matching the single Loci/Peg/POA a day's own
// lesson has always kept, one shared scene for the whole day rather than one per verse).
// Those feed Gemini's scene generator (see SceneGenerator.tsx) for the final line, the scene
// itself — editable, or typeable by hand. Not graded, same "self-checked" precedent as
// DrawFirstLetterRep. Persisted via setVersePOA so it can resurface later as that verse's own
// DayCircle icon.
export function VerseOrientationSummaryRep({ verses, verseOffsets, wordAnnotations, onComplete, layout }: VerseOrientationSummaryRepProps) {
  const anchor = verses[0];
  const setVersePOA = useProgressStore((state) => state.setVersePOA);
  const pegSystemEnabled = useProgressStore((state) => state.pegSystemEnabled);
  const locationTag = useProgressStore(
    (state) => state.locationTags[locationTagKey({ level: "verse", book: anchor.book, chapter: anchor.chapter, verseNumber: anchor.verseNumber })],
  );
  const recommendedPeg = pegWordFor(anchor.verseNumber);

  const [who, setWho] = useState("");
  const [action, setAction] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [scene, setScene] = useState("");
  // Pre-filled with the recommendation, but the reader can type over it — see
  // VersePOAInput.tsx and types/index.ts's VersePOA.pegWord.
  const [pegWord, setPegWord] = useState(recommendedPeg.word);
  const pegLine = pegSystemEnabled ? `${anchor.verseNumber} - ${pegWord}` : "";

  function handleContinue() {
    setVersePOA(anchor.book, anchor.chapter, anchor.verseNumber, {
      who: who.trim(),
      action: action.trim(),
      additionalInfo: additionalInfo.trim(),
      scene: scene.trim(),
      pegWord: pegSystemEnabled ? pegWord.trim() : undefined,
    });
    onComplete();
  }

  const canContinue = who.trim().length > 0 && action.trim().length > 0 && scene.trim().length > 0;

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
        Visualize <InfoTip text={INFO_TIPS.verseOrientationSummaryRep} />
      </p>
      <LessonWholeDayPageCard
        layout={layout}
        verses={verses}
        renderActiveVerse={(verse, verseIndex, range) => (
          <AnnotatedVerseWordRange verse={verse} range={range} wordAnnotations={wordAnnotations} verseOffset={verseOffsets[verseIndex] ?? 0} />
        )}
      />

      <LessonControlBar dockRef={layout.dockRef} verseText={verses.map((v) => v.text).join(" ")}>
        <VersePOAInput
          furnitureLabel={locationTag}
          pegWord={pegSystemEnabled ? pegWord : undefined}
          pegEmoji={recommendedPeg.emoji}
          onPegWordChange={setPegWord}
          who={who}
          action={action}
          additionalInfo={additionalInfo}
          onWhoChange={setWho}
          onActionChange={setAction}
          onAdditionalInfoChange={setAdditionalInfo}
        />
        <SceneGenerator
          inputs={{ locus: locationTag ?? "", pegLine, character: who, action, textProp: additionalInfo }}
          scene={scene}
          onSceneChange={setScene}
        />
        <motion.button
          type="button"
          whileTap={TAP_SCALE}
          disabled={!canContinue}
          onClick={handleContinue}
          className="rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continue
        </motion.button>
        <AutoCompleteButton onClick={onComplete} />
      </LessonControlBar>
    </div>
  );
}
