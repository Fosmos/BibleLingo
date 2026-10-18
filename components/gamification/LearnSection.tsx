"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { VerseSegment, MemorizationDay } from "@/types";
import { getAdjacentVerse } from "@/lib/chapterContent";
import { paginateVerseWindow } from "@/lib/chapterPagination";
import { joinVerses, verseNumberMarkers } from "@/lib/verseBatching";
import { tokenizeVerseWords } from "@/lib/verseWords";
import { useCheckpointField } from "@/lib/useSessionCheckpoint";
import { useRecordLearnedVerseCount } from "@/lib/useRecordLearnedVerseCount";
import { useCelebration } from "@/lib/useCelebration";
import { usePericopeHeading } from "@/lib/usePericopeHeading";
import { sliceWordAnnotations, type WordAnnotationMap } from "@/lib/verseHighlights";
import { useLearnSteps } from "@/lib/useLearnSteps";
import { useReportSheetStage } from "@/lib/useReportSheetStage";
import { learnSheetStage } from "@/lib/learnSheetStage";
import { useChapterScopedReadingLayout } from "@/lib/useChapterScopedReadingLayout";
import { useEmbeddedSenseCardOverride } from "@/lib/useEmbeddedSenseCardOverride";
import { useReferenceStep } from "@/lib/useReferenceStep";
import { useInputSwap } from "@/lib/useInputSwap";
import { senseLineSlice } from "@/lib/senseLineSlice";
import { ReferenceGate } from "@/components/gamification/ReferenceGate";
import { LearnPhaseContent } from "@/components/gamification/LearnPhaseContent";
import { LearnCumulativeStage } from "@/components/gamification/LearnCumulativeStage";
import { LearnSpeakVerseStage } from "@/components/gamification/LearnSpeakVerseStage";
import { LearnTopBar } from "@/components/gamification/LearnTopBar";
import { SectionCompleteOverlay } from "@/components/ui/SectionCompleteOverlay";

interface LearnSectionProps {
  day: MemorizationDay;
  // The path's whole plan, narrowed to this lesson's chapter for useChapterReadingLayout.
  allDays: MemorizationDay[];
  completedDays: number;
  todaysDay: number;
  label: string;
  version: string;
  onComplete: () => void;
  // Set only by the in-place lesson flow: LessonTopBar's "Back" calls it (DaySessionController.tsx).
  onExit?: () => void;
  sessionKey?: string;
  // See InPlaceLessonSession.tsx's own doc comment — threaded straight through to LearnTopBar.
  embeddedInMindMap?: boolean;
}

// A heavier day's worth of new verses gets a longer prayer timer (PrayRep.tsx's default is 30s).
const PRAY_LONGER_VERSE_THRESHOLD = 3;
const LONGER_PRAYER_DURATION_S = 60;

function noopAnnotationsChange() {} // Only the orientation phase changes annotations.

// A day's new verses go through Orientation ONCE, then each verse runs its stages one at a time
// (lib/learnSteps.ts) — every recall stage drilling the verse's reference as its opening, entered
// the same way (lib/useReferenceStep.ts, ReferenceGate.tsx) — and a prayer timer closes it out. The session shares ONE top bar and
// ONE fixed set of `contextVerses` (today's real verses plus a neighbour each side), paginated
// per stage to the page holding the active verse, so the parchment never resizes.
export function LearnSection({ day, allDays, completedDays, todaysDay, label, version, onComplete, onExit, sessionKey, embeddedInMindMap }: LearnSectionProps) {
  const [senseCardFillHeightPx, senseCardColumnWidthPx] = useEmbeddedSenseCardOverride(embeddedInMindMap);
  const layout = useChapterScopedReadingLayout(allDays, day, completedDays, todaysDay, senseCardFillHeightPx, senseCardColumnWidthPx);
  const wholeDay = useMemo(() => joinVerses(day.newVerses, "day"), [day.newVerses]);
  // Each verse's first-word offset in the whole-day text, to slice Orientation's wordAnnotations.
  const verseOffsets = useMemo(() => {
    const offsets: number[] = [];
    let total = 0;
    for (const verse of day.newVerses) {
      offsets.push(total);
      total += tokenizeVerseWords(verse.text).length;
    }
    return offsets;
  }, [day.newVerses]);
  // Which of day.newVerses have something to drill (a translation's gap verse has no stages).
  const realVerseIndices = useMemo(
    () => day.newVerses.map((_, index) => index).filter((index) => day.newVerses[index].text.trim().length > 0),
    [day.newVerses],
  );
  const realVerses = useMemo(() => realVerseIndices.map((index) => day.newVerses[index]), [realVerseIndices, day.newVerses]);
  // `verseOffsets` re-indexed to `realVerses` (no gap verses), which the whole-day phases render.
  const realVerseOffsets = useMemo(() => realVerseIndices.map((index) => verseOffsets[index]), [realVerseIndices, verseOffsets]);
  const firstReal = realVerses[0];
  const lastReal = realVerses[realVerses.length - 1];
  const previousVerse = firstReal ? getAdjacentVerse(firstReal.book, firstReal.chapter, firstReal.verseNumber, -1) : undefined;
  const nextVerse = lastReal ? getAdjacentVerse(lastReal.book, lastReal.chapter, lastReal.verseNumber, 1) : undefined;
  // The fixed "page" every per-verse stage renders against (computed once — see the doc comment).
  const contextVerses = useMemo(
    () => [previousVerse, ...realVerses, nextVerse].filter((entry): entry is VerseSegment => entry !== undefined),
    [previousVerse, realVerses, nextVerse],
  );
  const heading = usePericopeHeading(firstReal?.book ?? "", firstReal?.chapter ?? 0, firstReal?.verseNumber ?? 0);

  const steps = useLearnSteps(realVerseIndices, day.newVerses);
  const [stepIndex, setStepIndex] = useCheckpointField(sessionKey, "learnLineStep", 0); // Not the old "learnStepIndex": saved under the pre-sense-line steps.
  useReportSheetStage(learnSheetStage(steps, stepIndex, day), embeddedInMindMap);
  useRecordLearnedVerseCount(sessionKey, steps, stepIndex);
  const [wordAnnotations, setWordAnnotations] = useState<WordAnnotationMap>({});
  const { pending, celebrate, finish } = useCelebration();
  const advance = () => (stepIndex + 1 >= steps.length ? celebrate(onComplete, "New Verses Learned") : celebrate(() => setStepIndex(stepIndex + 1)));
  // The step as it runs — a spoken drill may be typed instead, or the other way (Speak / Type chip).
  const { step, typedPayload } = useInputSwap(steps[stepIndex]);
  const reference = useReferenceStep(step, stepIndex, day);

  if (pending) return <SectionCompleteOverlay text={pending.text} onDone={finish} />;

  if (!step) return null;

  const topBar = (
    <LearnTopBar
      phase={step.phase}
      verseIndex={step.verseIndex}
      day={day}
      allDays={allDays}
      completedDays={completedDays}
      todaysDay={todaysDay}
      label={label}
      version={version}
      current={stepIndex + 1}
      total={steps.length}
      onExit={onExit}
      layout={layout}
      embeddedInMindMap={embeddedInMindMap}
    />
  );

  // Every stage sits inside the reference gate, so a recall stage drills its reference first.
  const gated = (content: ReactNode) => (
    <ReferenceGate key={stepIndex} asking={reference.asking} onDone={reference.done}>
      {content}
    </ReferenceGate>
  );

  if (step.phase === "speak_verse" || step.phase === "speak_payload") {
    return gated(
      <LearnSpeakVerseStage
        day={day}
        verseIndex={step.verseIndex}
        lines={step.lines}
        contextVerses={contextVerses}
        heading={heading}
        layout={layout}
        topBar={topBar}
        payload={step.phase === "speak_payload"}
        typed={typedPayload}
        onAdvance={advance}
      />,
    );
  }

  if (step.phase === "type_cumulative_today") {
    // Never day.reviewVerses (prior days' own verses), which is ReviewSection's job, not this
    // one's.
    return gated(
      <LearnCumulativeStage
        day={day}
        cumulativeVerseIndices={step.cumulativeVerseIndices ?? []}
        layout={layout}
        topBar={topBar}
        embeddedInMindMap={embeddedInMindMap}
        onAdvance={advance}
      />,
    );
  }

  const wholeDayPhase = step.verseIndex === undefined;
  const fullVerse = wholeDayPhase ? wholeDay : day.newVerses[step.verseIndex!];
  // A sense-line stage drills just its lines of the verse (lib/senseLineSlice.ts).
  const verse = step.lines ? senseLineSlice(fullVerse, step.lines) : fullVerse;
  const annotations = wholeDayPhase
    ? wordAnnotations
    : step.lines
      ? {}
      : sliceWordAnnotations(wordAnnotations, verseOffsets[step.verseIndex!], tokenizeVerseWords(verse.text).length);
  const verseMarkers = wholeDayPhase ? verseNumberMarkers(day.newVerses) : {};

  const stageKey = `${step.phase}-${step.verseIndex ?? "day"}-${step.lines?.join("-") ?? "all"}`;
  // The reading view's own pagination budget, run over this fixed page and keyed to whichever
  // verse is active — left unbounded, a normal day's verses can overflow the fixed, non-
  // scrolling parchment box the same way an unpaginated reading-view chapter would.
  const verseWindow = wholeDayPhase ? undefined : paginateVerseWindow(contextVerses, heading, fullVerse.id, layout.pageBudget);

  return gated(
    <>
      {topBar}
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 pt-3">
        <LearnPhaseContent
          phase={step.phase}
          stageKey={stageKey}
          verse={verse}
          verses={realVerses}
          verseOffsets={realVerseOffsets}
          speakLabel="Remember"
          verseMarkers={verseMarkers}
          wordAnnotations={annotations}
          onWordAnnotationsChange={step.phase === "orientation" ? setWordAnnotations : noopAnnotationsChange}
          contextVerses={verseWindow?.verses}
          layout={layout}
          prayDurationSeconds={realVerseIndices.length > PRAY_LONGER_VERSE_THRESHOLD ? LONGER_PRAYER_DURATION_S : undefined}
          onAdvance={advance}
        />
      </div>
    </>,
  );
}
