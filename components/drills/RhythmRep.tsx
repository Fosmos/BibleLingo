"use client";

import { Fragment, useMemo, useState } from "react";
import type { VerseSegment } from "@/types";
import { buildVerseClauses, type ClauseWord } from "@/lib/verseClauses";
import { playCorrectSfx } from "@/lib/audio";
import { speak } from "@/lib/speechSynthesis";
import type { WordAnnotationMap } from "@/lib/verseHighlights";
import { AnnotatedVerseWord } from "@/components/drills/AnnotatedVerseWord";
import { VerseNumberMarker } from "@/components/drills/VerseNumberMarker";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import { VerseContextLine } from "@/components/ui/VerseContextLine";
import { VerseTextLine } from "@/components/ui/VerseTextLine";
import { VerseReferenceHeader } from "@/components/ui/VerseReferenceHeader";

interface RhythmRepProps {
  verse: VerseSegment;
  verseMarkers: Record<number, number>;
  annotations: WordAnnotationMap;
  previousVerse?: VerseSegment;
  nextVerse?: VerseSegment;
  onComplete: () => void;
}

// Stage 3: every noun/verb in the verse (lib/verseClauses.ts's isContentWord heuristic — no
// real POS tagger in this stack) is bolded and capitalized. One word is highlighted at a
// time — tapping the press zone below moves the highlight to the next word (and reads it
// aloud) and advances just as plainly whether or not it's a main word.
export function RhythmRep({ verse, verseMarkers, annotations, previousVerse, nextVerse, onComplete }: RhythmRepProps) {
  const clauses = useMemo(() => buildVerseClauses(verse.text), [verse.text]);
  const flatWords = useMemo(() => clauses.flatMap((clause) => clause.words), [clauses]);
  const [wordIndex, setWordIndex] = useState(0);

  const currentWord: ClauseWord | undefined = flatWords[wordIndex];

  function advance() {
    if (!currentWord) return;
    playCorrectSfx();
    speak(currentWord.word, undefined, { emphasize: currentWord.isMain });
    const next = wordIndex + 1;
    if (next >= flatWords.length) {
      onComplete();
      return;
    }
    setWordIndex(next);
  }

  if (!currentWord) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
          Learn <InfoTip text={INFO_TIPS.rhythmRep} />
        </p>
        <VerseReferenceHeader book={verse.book} chapter={verse.chapter} verseNumber={verse.verseNumber} />
      </div>
      {previousVerse && <VerseContextLine verse={previousVerse} />}
      <p className="flex flex-wrap items-baseline gap-x-4 gap-y-3 text-lg leading-relaxed">
        <VerseTextLine chapter={verse.chapter} verseNumber={verse.verseNumber} />
        {flatWords.map((clauseWord, index) => {
          const stateClassName =
            index === wordIndex
              ? "rounded bg-brand-100 px-1 font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
              : index < wordIndex
                ? "text-ink-muted dark:text-zinc-600"
                : "text-ink dark:text-zinc-100";
          return (
            <Fragment key={index}>
              {verseMarkers[index] && (
                <>
                  <span className="basis-full" />
                  <VerseNumberMarker number={verseMarkers[index]} />
                </>
              )}
              <AnnotatedVerseWord
                word={clauseWord.isMain ? clauseWord.word.toUpperCase() : clauseWord.word}
                annotation={annotations[index]}
                className={`${stateClassName} ${clauseWord.isMain ? "font-bold" : ""}`}
              />
            </Fragment>
          );
        })}
      </p>
      {nextVerse && <VerseContextLine verse={nextVerse} />}

      <button
        type="button"
        onClick={advance}
        className="flex h-16 items-center justify-center rounded-2xl border border-line bg-mist/40 text-sm font-medium text-ink-soft dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300"
      >
        Tap for the next word
      </button>

      <AutoCompleteButton onClick={onComplete} />
    </div>
  );
}
