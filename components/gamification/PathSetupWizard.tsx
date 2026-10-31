"use client";

import { useState } from "react";
import type { PathReminder } from "@/types";
import { findBook } from "@/lib/bibleBooks";
import { BIBLE_VERSIONS } from "@/lib/bibleVersions";
import { TOPICS } from "@/lib/memorizationContent";
import { ensureChapterLoaded, BibleFetchError } from "@/lib/bibleApiClient";
import { mapWithConcurrency } from "@/lib/fetchWithConcurrency";
import { useLearnIntensityFlow } from "@/lib/useLearnIntensityFlow";
import { useStartingPointFlow } from "@/lib/useStartingPointFlow";
import { useStartNewPath } from "@/lib/useStartNewPath";
import type { PathChoice } from "@/lib/pathChoice";
import { SetupStepFrame } from "@/components/gamification/SetupStepFrame";
import { PathOptionRow } from "@/components/gamification/PathOptionRow";
import { PATH_REMINDERS } from "@/lib/pathEdit";
import { PaceStepper } from "@/components/gamification/PaceStepper";
import { LearnIntensityPicker } from "@/components/gamification/LearnIntensityPicker";
import { StartingPointFlow } from "@/components/gamification/StartingPointFlow";
import { FetchLoading, FetchError } from "@/components/ui/FetchStatus";

interface PathSetupWizardProps {
  choice: PathChoice;
  onBack: () => void;
}

type Step = "translation" | "pace" | "intensity" | "start" | "reminder";
// Setting up a new path (design_handoff_path_picker → Setup): translation, new verses a day, then
// — as before — Learn intensity and "already learned some of this?" for books and chapters, and
// last a daily reminder (saved only, for now). Verse paths skip the pace; topics, whose verses
// are one fixed translation, skip the translation.
export function PathSetupWizard({ choice, onBack }: PathSetupWizardProps) {
  const startNewPath = useStartNewPath();
  const book = choice.book ? (findBook(choice.book) ?? null) : null;
  const steps: Step[] = choice.kind === "verse" ? ["translation", "reminder"] : choice.kind === "topic" ? ["pace", "reminder"] : ["translation", "pace", "intensity", "start", "reminder"];
  const [stepIndex, setStepIndex] = useState(0);
  const [version, setVersion] = useState(choice.kind === "topic" ? "KJV" : "ESV");
  const [pace, setPace] = useState<number | "">(2);
  const [total, setTotal] = useState(choice.kind === "topic" ? (TOPICS.find((topic) => choice.key.endsWith(topic.id))?.verses.length ?? 1) : 1);
  const [reminder, setReminder] = useState<PathReminder>("morning");
  const [finish, setFinish] = useState<{ versesPerDay?: number; prior?: number }>({});
  const [status, setStatus] = useState<{ loading?: string; error?: string }>({});
  const step = steps[stepIndex];
  const next = () => setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  const back = () => (stepIndex === 0 ? onBack() : setStepIndex((index) => index - 1));

  // The existing book/chapter chain (lib/useLearnIntensityFlow.ts → lib/useStartingPointFlow.ts),
  // its final "go" caught here so the reminder step comes last.
  const capture = (_identifier: string, _kind: string, _version: string, versesPerDay?: number, prior?: number) => {
    setFinish({ versesPerDay, prior });
    setStepIndex(steps.indexOf("reminder"));
  };
  const startingPoint = useStartingPointFlow({ selectedBook: book, goToPath: capture, onLoading: (loading) => setStatus({ loading }), onError: (error) => setStatus({ error }), onIdle: () => setStatus({}) });
  const intensity = useLearnIntensityFlow({ mode: choice.kind === "book" ? "book" : "chapter", selectedBook: book, selectedChapter: choice.chapter ?? null, selectedVersion: version, goToPath: startingPoint.requestFinish });

  // Loads the passage in the chosen translation (as before), so the pace knows its real length.
  async function confirmTranslation() {
    if (!book) return next();
    try {
      if (choice.kind === "book") {
        const chapters = Array.from({ length: book.chapterCount }, (_, index) => index + 1);
        const loaded = await mapWithConcurrency(chapters, 4, (chapter) => {
          setStatus({ loading: `Loading ${book.name} ${chapter} of ${book.chapterCount}…` });
          return ensureChapterLoaded(book.name, chapter, version);
        });
        setTotal(loaded.reduce((sum, verses) => sum + verses.length, 0));
      } else if (choice.chapter) {
        setStatus({ loading: `Loading ${choice.title}…` });
        setTotal((await ensureChapterLoaded(book.name, choice.chapter, version)).length);
      }
      setStatus({});
      next();
    } catch (error) {
      setStatus({ error: error instanceof BibleFetchError ? error.message : "Couldn't load that passage." });
    }
  }

  if (status.loading) return <FetchLoading label={status.loading} />;
  if (status.error) return <FetchError message={status.error} onRetry={() => setStatus({})} />;
  const frame = { step: stepIndex, steps: steps.length, title: choice.title, onBack: back };

  if (step === "intensity" && intensity.pendingVersesPerDay !== null) {
    return (
      <SetupStepFrame {...frame}>
        <LearnIntensityPicker initialStages={intensity.initialStages} initialMemoryPalace={intensity.initialMemoryPalace} onContinue={(stages, palace) => (intensity.handleIntensityContinue(stages, palace), next())} onBack={back} />
      </SetupStepFrame>
    );
  }
  if (step === "start" && startingPoint.pendingFinish && book) {
    return (
      <SetupStepFrame {...frame}>
        <StartingPointFlow book={book} kind={startingPoint.pendingFinish.kind} fixedChapter={choice.chapter} fixedChapterVerseCount={choice.kind === "chapter" ? total : undefined} version={version} onStartFromBeginning={startingPoint.finishFromBeginning} onPickStartingPoint={startingPoint.handleStartingPointPicked} onBack={back} />
      </SetupStepFrame>
    );
  }
  if (step === "translation") {
    return (
      <SetupStepFrame {...frame} question="Which translation?" sub="The version you'll read and recite." cta={{ label: "Next", onClick: confirmTranslation }}>
        {BIBLE_VERSIONS.map((entry) => (
          <PathOptionRow key={entry.code} title={entry.code} meta={entry.name} suggested={entry.code === "ESV"} selected={version === entry.code} onSelect={() => setVersion(entry.code)} />
        ))}
      </SetupStepFrame>
    );
  }
  if (step === "pace") {
    const confirmPace = () => {
      if (pace === "") return;
      if (choice.kind === "topic") return (setFinish({ versesPerDay: pace }), next());
      intensity.handleSelectVersesPerDay(pace);
      next();
    };
    return (
      <SetupStepFrame {...frame} question="How many new verses a day?" sub="Reviews of what you've learned are added on top." cta={{ label: "Next", onClick: confirmPace, disabled: pace === "" }}>
        <PaceStepper value={pace} onChange={setPace} totalVerses={total} />
      </SetupStepFrame>
    );
  }
  return (
    <SetupStepFrame {...frame} question="When should we remind you?" sub="One gentle nudge a day." cta={{ label: `Start ${choice.title}`, onClick: () => startNewPath({ key: choice.key, version, versesPerDay: finish.versesPerDay, priorKnownVerseCount: finish.prior, reminder }) }}>
      {PATH_REMINDERS.map((entry) => (
        <PathOptionRow key={entry.value} title={entry.title} meta={entry.sub} suggested={entry.value === "morning"} selected={reminder === entry.value} onSelect={() => setReminder(entry.value)} />
      ))}
    </SetupStepFrame>
  );
}
