"use client";

import { Fragment, useState } from "react";
import { motion } from "framer-motion";
import type { VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { locationTagKey } from "@/lib/locationTags";
import { tokenizeVerseWords } from "@/lib/verseWords";
import { TAP_SCALE } from "@/lib/motionTokens";
import type { WordAnnotationMap } from "@/lib/verseHighlights";
import { AnnotatedVerseWord } from "@/components/drills/AnnotatedVerseWord";
import { VerseNumberMarker } from "@/components/drills/VerseNumberMarker";
import { VersePOAInput } from "@/components/drills/VersePOAInput";
import { SceneGenerator } from "@/components/drills/SceneGenerator";
import { pegWordFor } from "@/lib/pegSystem";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import { VerseContextLine } from "@/components/ui/VerseContextLine";
import { VerseReferenceHeader } from "@/components/ui/VerseReferenceHeader";
import { VerseTextLine } from "@/components/ui/VerseTextLine";

interface VerseOrientationSummaryRepProps {
  verse: VerseSegment;
  verseMarkers: Record<number, number>;
  annotations: WordAnnotationMap;
  onComplete: () => void;
  previousVerse?: VerseSegment;
  nextVerse?: VerseSegment;
}

// The "Visualize" stage (second half of Understand+Visualize, see VerseOrientationRep for
// the first): with the verse's structure already worked through by highlighting/annotating
// it, this step has the reader read it once more in full, then fill 5 lines — Loci (this
// verse's own location tag, if one's been added — see lib/locationTags.ts; blank otherwise)
// and Peg (the verse-number word, only shown when the peg system is on — pre-filled with
// lib/pegSystem.ts's recommendation but the reader can type their own word instead) for
// context, then their own Who and Action and an optional extra detail.
// Those feed Gemini's scene generator (see SceneGenerator.tsx) for the final line, the scene
// itself — editable, or typeable by hand. Not graded, same "self-checked" precedent as
// DrawFirstLetterRep. Shows the same highlights/notes the reader just made (read-only here —
// see AnnotatedVerseWord.tsx). Persisted via setVersePOA so it can resurface later as the
// gentlest level of VerseRevealHelp's hint sequence.
export function VerseOrientationSummaryRep({
  verse,
  verseMarkers,
  annotations,
  onComplete,
  previousVerse,
  nextVerse,
}: VerseOrientationSummaryRepProps) {
  const words = tokenizeVerseWords(verse.text);
  const setVersePOA = useProgressStore((state) => state.setVersePOA);
  const pegSystemEnabled = useProgressStore((state) => state.pegSystemEnabled);
  const locationTag = useProgressStore(
    (state) => state.locationTags[locationTagKey({ level: "verse", book: verse.book, chapter: verse.chapter, verseNumber: verse.verseNumber })],
  );
  const recommendedPeg = pegWordFor(verse.verseNumber);

  const [who, setWho] = useState("");
  const [action, setAction] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [scene, setScene] = useState("");
  // Pre-filled with the recommendation, but the reader can type over it — see
  // VersePOAInput.tsx and types/index.ts's VersePOA.pegWord.
  const [pegWord, setPegWord] = useState(recommendedPeg.word);
  const pegLine = pegSystemEnabled ? `${verse.verseNumber} - ${pegWord}` : "";

  function handleContinue() {
    setVersePOA(verse.book, verse.chapter, verse.verseNumber, {
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
    <div className="flex flex-col gap-6">
      <div>
        <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
          Visualize <InfoTip text={INFO_TIPS.verseOrientationSummaryRep} />
        </p>
        <VerseReferenceHeader book={verse.book} chapter={verse.chapter} verseNumber={verse.verseNumber} />
      </div>
      {previousVerse && <VerseContextLine verse={previousVerse} />}
      <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-2 text-lg leading-relaxed">
        <VerseTextLine chapter={verse.chapter} verseNumber={verse.verseNumber} />
        {words.map((word, index) => (
          <Fragment key={index}>
            {verseMarkers[index] && (
              <>
                <span className="basis-full" />
                <VerseNumberMarker number={verseMarkers[index]} />
              </>
            )}
            <AnnotatedVerseWord word={word} annotation={annotations[index]} />
          </Fragment>
        ))}
      </p>
      {nextVerse && <VerseContextLine verse={nextVerse} />}
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
      <div className="flex items-center gap-4">
        <motion.button
          type="button"
          whileTap={TAP_SCALE}
          disabled={!canContinue}
          onClick={handleContinue}
          className="rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continue
        </motion.button>
      </div>
      <AutoCompleteButton onClick={onComplete} />
    </div>
  );
}
