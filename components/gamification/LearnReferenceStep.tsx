"use client";

import type { VerseSegment } from "@/types";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { referenceAnswer, type ReferenceMode } from "@/lib/referenceAnswer";
import { useReferenceEntry } from "@/lib/useReferenceEntry";
import { useTrayPrompt } from "@/lib/useTrayPrompt";
import { tokenizeVerseWords } from "@/lib/verseWords";
import { LessonPageCard } from "@/components/gamification/LessonPageCard";
import { LessonControlBar } from "@/components/gamification/LessonControlBar";
import { ReferenceSlots } from "@/components/drills/ReferenceSlots";
import { PeekWord } from "@/components/drills/PeekWord";
import { ReferenceBankEntry } from "@/components/drills/ReferenceBankEntry";
import { ReferenceKeyEntry } from "@/components/drills/ReferenceKeyEntry";
import { ReferenceSpeakEntry } from "@/components/drills/ReferenceSpeakEntry";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";

interface LearnReferenceStepProps {
  verse: VerseSegment;
  mode: ReferenceMode;
  layout: ChapterReadingLayout;
  onDone: () => void;
}

const PROMPT: Record<ReferenceMode, string> = {
  bank: "First, where is it from? Tap the book, chapter and verse",
  letters: "First, where is it from? Type the book's first letter, then the numbers",
  speak: "First, where is it from? Say the book, chapter and verse",
};

// The opening of each recall stage of a Learn lesson (not review): the verse's reference, recalled
// first on the verse's reference line under it (ReferenceSlots.tsx), entered the way the stage is —
// from a word bank, typed, or said (lib/referenceAnswer.ts) — while the verse's words wait hidden
// below. A wrong part shows its answer, to enter again; then the stage goes on to the words.
export function LearnReferenceStep({ verse, mode, layout, onDone }: LearnReferenceStepProps) {
  const correct = referenceAnswer(verse);
  const entry = useReferenceEntry(correct, onDone);
  const Entry = mode === "bank" ? ReferenceBankEntry : mode === "speak" ? ReferenceSpeakEntry : ReferenceKeyEntry;
  const words = tokenizeVerseWords(verse.text);
  const inTray = useTrayPrompt(PROMPT[mode]);
  return (
    <div className="flex flex-col gap-3">
      <LessonPageCard
        layout={layout}
        activeVerse={verse}
        referenceSlot={<ReferenceSlots entry={entry} correct={correct} />}
        renderActiveVerse={(_, range) => (
          <>
            {words.slice(range.startIndex, range.endIndex).map((word, offset) => (
              <span key={range.startIndex + offset}>
                <PeekWord word={word}>
                  <span className="rounded-md bg-sand-300 px-[.12em] text-transparent dark:bg-zinc-700">{word}</span>
                </PeekWord>{" "}
              </span>
            ))}
          </>
        )}
      />
      <LessonControlBar dockRef={layout.dockRef}>
        {!inTray && <p className="text-center text-caption font-semibold uppercase tracking-wide text-brand-500">{PROMPT[mode]}</p>}
        <Entry entry={entry} correct={correct} />
        <AutoCompleteButton onClick={onDone} />
      </LessonControlBar>
    </div>
  );
}
