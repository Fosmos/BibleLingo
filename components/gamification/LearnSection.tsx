"use client";

import { useMemo, useState } from "react";
import type { VerseSegment, MemorizationDay } from "@/types";
import { getAdjacentVerse } from "@/lib/chapterContent";
import { paginateVerseWindow } from "@/lib/chapterPagination";
import { joinVerses, verseNumberMarkers } from "@/lib/verseBatching";
import { tokenizeVerseWords } from "@/lib/verseWords";
import { useCheckpointField } from "@/lib/useSessionCheckpoint";
import { useCelebration } from "@/lib/useCelebration";
import { usePericopeHeading } from "@/lib/usePericopeHeading";
import { sliceWordAnnotations, type WordAnnotationMap } from "@/lib/verseHighlights";
import { useLearnSteps } from "@/lib/useLearnSteps";
import { useChapterScopedReadingLayout } from "@/lib/useChapterScopedReadingLayout";
import { LearnPhaseContent } from "@/components/gamification/LearnPhaseContent";
import { LessonChrome } from "@/components/gamification/LessonChrome";
import { ReviewChain } from "@/components/drills/ReviewChain";
import { SpeakRep } from "@/components/drills/SpeakRep";
import { SectionCompleteOverlay } from "@/components/ui/SectionCompleteOverlay";

interface LearnSectionProps {
  day: MemorizationDay;
  // This whole path's own full day plan (see DaySessionController.tsx) — narrowed to just
  // this lesson's own chapter (lib/chapterScopedDays.ts) before powering useChapterReadingLayout.
  allDays: MemorizationDay[];
  completedDays: number;
  todaysDay: number;
  label: string;
  version: string;
  onComplete: () => void;
  // See DaySessionController.tsx's own doc comment — set only by the in-place lesson flow;
  // LessonTopBar's own "Back" calls this instead of navigating anywhere when it's set.
  onExit?: () => void;
  sessionKey?: string;
}

// A heavier day's worth of new verses gets a longer prayer timer — see PrayRep.tsx's own
// default (30s) for everything at or under this threshold.
const PRAY_LONGER_VERSE_THRESHOLD = 3;
const LONGER_PRAYER_DURATION_S = 60;

function noopAnnotationsChange() {
  // Only the orientation phase ever calls this — every other phase gets this no-op.
}

// A day's new verses go through Orientation (highlight/annotate + 3-word summary) ONCE across
// every verse selected today. Then each verse, one at a time, runs Rhythm → Write First
// Letter → Speak (first-letter hint) → Type it by first letter → speak that one verse aloud
// from memory → (every verse but the first) type every verse learned today so far by first
// letter, growing verse by verse — before moving to the next verse. One prayer timer closes
// the lesson out, dead last — right before whatever review follows (Chapter Review, etc.).
//
// The whole session shares ONE LessonTopBar and ONE fixed set of `contextVerses` — today's own
// real verses plus a neighbor on each side, computed once — paginated per-stage down to just
// the one page holding the active verse (see paginateVerseWindow), so the parchment never
// resizes as the stage changes, only the active page/verse does.
export function LearnSection({ day, allDays, completedDays, todaysDay, label, version, onComplete, onExit, sessionKey }: LearnSectionProps) {
  // See lib/useChapterScopedReadingLayout.ts — book mode's `allDays` spans every chapter;
  // pagination needs just this lesson's own.
  const layout = useChapterScopedReadingLayout(allDays, day, completedDays, todaysDay);
  const wholeDay = useMemo(() => joinVerses(day.newVerses, "day"), [day.newVerses]);
  // Word offset of each verse's own first word within the whole-day joined text — lets a
  // verse's stages read the slice of wordAnnotations (made once, during Orientation, against
  // the whole-day text) relevant to just its own words.
  const verseOffsets = useMemo(() => {
    const offsets: number[] = [];
    let total = 0;
    for (const verse of day.newVerses) {
      offsets.push(total);
      total += tokenizeVerseWords(verse.text).length;
    }
    return offsets;
  }, [day.newVerses]);
  // Which of day.newVerses actually have something to drill — see buildSteps's own doc
  // comment on why a translation's gap verse (still present in day.newVerses itself) never
  // gets its own per-verse stages.
  const realVerseIndices = useMemo(
    () => day.newVerses.map((_, index) => index).filter((index) => day.newVerses[index].text.trim().length > 0),
    [day.newVerses],
  );
  const realVerses = useMemo(() => realVerseIndices.map((index) => day.newVerses[index]), [realVerseIndices, day.newVerses]);
  // `verseOffsets` above is indexed against `day.newVerses` (it has to be — wordAnnotations is
  // built against the whole-day joined text, gap verses included, so offsets stay aligned to
  // that same indexing); the whole-day phases below render `realVerses` instead (no gap
  // verses), so they need that same offset re-indexed to `realVerses`' own positions.
  const realVerseOffsets = useMemo(() => realVerseIndices.map((index) => verseOffsets[index]), [realVerseIndices, verseOffsets]);
  const firstReal = realVerses[0];
  const lastReal = realVerses[realVerses.length - 1];
  const previousVerse = firstReal ? getAdjacentVerse(firstReal.book, firstReal.chapter, firstReal.verseNumber, -1) : undefined;
  const nextVerse = lastReal ? getAdjacentVerse(lastReal.book, lastReal.chapter, lastReal.verseNumber, 1) : undefined;
  // The fixed "page" every per-verse stage renders against — see this component's own doc
  // comment on why this is computed once rather than per stage.
  const contextVerses = useMemo(
    () => [previousVerse, ...realVerses, nextVerse].filter((entry): entry is VerseSegment => entry !== undefined),
    [previousVerse, realVerses, nextVerse],
  );
  const heading = usePericopeHeading(firstReal?.book ?? "", firstReal?.chapter ?? 0, firstReal?.verseNumber ?? 0);

  const steps = useLearnSteps(realVerseIndices);

  const [stepIndex, setStepIndex] = useCheckpointField(sessionKey, "learnStepIndex", 0);
  const [wordAnnotations, setWordAnnotations] = useState<WordAnnotationMap>({});
  const { pending, celebrate, finish } = useCelebration();

  if (pending) return <SectionCompleteOverlay text={pending.text} onDone={finish} />;

  const step = steps[stepIndex];
  if (!step) return null;

  function advance() {
    const next = stepIndex + 1;
    if (next >= steps.length) celebrate(onComplete, "New Verses Learned");
    else celebrate(() => setStepIndex(next));
  }

  const topBar = <LessonChrome label={label} version={version} current={stepIndex + 1} total={steps.length} onExit={onExit} layout={layout} />;

  if (step.phase === "speak_verse") {
    // Just the one verse this stage follows — spoken aloud from memory on its own, not folded
    // into everything learned so far (that's ReviewSection's job). Same mechanic ChapterReviewStage's
    // own "Recite it all" stage uses. firstLettersOnMistake keeps a miss from handing back the
    // answer it's testing. contextVerses/heading windowed like every per-verse stage below.
    const verseForStage = day.newVerses[step.verseIndex ?? day.newVerses.length - 1];
    const speakWindow = paginateVerseWindow(contextVerses, heading, verseForStage.id, layout.pageBudget);
    return (
      <>
        {topBar}
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 pt-3">
          <SpeakRep
            label="Remember"
            reference={verseForStage.reference}
            targetText={verseForStage.text}
            reps={1}
            verse={verseForStage}
            contextVerses={speakWindow.verses}
            layout={layout}
            firstLettersOnMistake
            onComplete={() => advance()}
          />
        </div>
      </>
    );
  }

  if (step.phase === "type_cumulative_today") {
    // The explicit verse list buildSteps already worked out for this exact check — either a
    // group's own so-far (a split day's per-half interim check) or every real verse learned
    // today (the split day's own final combine stage, right before Pray) — never
    // day.reviewVerses (prior days' own verses), which is ReviewSection's job, not this one's.
    const versesLearnedSoFar = (step.cumulativeVerseIndices ?? []).map((index) => day.newVerses[index]);
    return (
      <>
        {topBar}
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 pt-3">
          <ReviewChain verses={versesLearnedSoFar} label="Remember" layout={layout} onComplete={() => advance()} />
        </div>
      </>
    );
  }

  const wholeDayPhase = step.verseIndex === undefined;
  const verse = wholeDayPhase ? wholeDay : day.newVerses[step.verseIndex!];
  const annotations = wholeDayPhase
    ? wordAnnotations
    : sliceWordAnnotations(wordAnnotations, verseOffsets[step.verseIndex!], tokenizeVerseWords(verse.text).length);
  const verseMarkers = wholeDayPhase ? verseNumberMarkers(day.newVerses) : {};

  const stageKey = `${step.phase}-${step.verseIndex ?? "day"}`;
  // The reading view's own pagination budget, run over this fixed page and keyed to whichever
  // verse is active — left unbounded, a normal day's verses can overflow the fixed, non-
  // scrolling parchment box the same way an unpaginated reading-view chapter would.
  const verseWindow = wholeDayPhase ? undefined : paginateVerseWindow(contextVerses, heading, verse.id, layout.pageBudget);

  return (
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
          previousVerse={previousVerse}
          nextVerse={nextVerse}
          layout={layout}
          prayDurationSeconds={realVerseIndices.length > PRAY_LONGER_VERSE_THRESHOLD ? LONGER_PRAYER_DURATION_S : undefined}
          onAdvance={advance}
        />
      </div>
    </>
  );
}
