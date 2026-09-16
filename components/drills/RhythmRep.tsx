"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
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
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import type { SenseLineWordRange } from "@/lib/senseLineWordRanges";
import { LessonParchmentCard } from "@/components/gamification/LessonParchmentCard";
import { LessonControlBar } from "@/components/gamification/LessonControlBar";
import { LessonPageCard } from "@/components/gamification/LessonPageCard";

interface RhythmRepProps {
  verse: VerseSegment;
  verseMarkers: Record<number, number>;
  annotations: WordAnnotationMap;
  // The reading view's own real page layout (see lib/useChapterReadingLayout.ts) — set by the
  // Learn flow only (the only caller). When set, the verse renders on the SAME real reading-
  // view page/size/position as browsing, via LessonPageCard.tsx, instead of a plain
  // unpaginated paragraph.
  layout?: ChapterReadingLayout;
  onComplete: () => void;
}

// Stage 3: one word highlighted at a time — tapping the press zone below moves the highlight
// to the next word (and reads it aloud) and advances just as plainly whether or not it's a
// main word. Every word stays the exact same size and weight as plain reading text — only the
// CURRENT word is marked, with a color + underline, never a size, weight, or case change
// (this stage used to bold+capitalize every noun/verb, which read as the verse's own font
// changing mid-lesson).
export function RhythmRep({ verse, verseMarkers, annotations, layout, onComplete }: RhythmRepProps) {
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

  // A verse the ESV (or another provider) omits entirely comes back as an empty string —
  // e.g. Mark 11:26, a real, documented gap (see lib/bibleProviders/esv.ts), not a rare edge
  // case — which tokenizes to zero words here. That used to just `return null` forever: a
  // genuinely blank stage with no button, no fallback, nothing to tap, a dead end with no way
  // out short of the whole-day skip. Auto-advancing past it instead: there's nothing real to
  // drill for a verse the translation itself doesn't print.
  useEffect(() => {
    if (!currentWord) onComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per verse, not on every onComplete identity change
  }, [currentWord]);

  if (!currentWord) return null;

  const activeVerseWords = (
    <Fragment>
      {!layout && <sup className="mr-0.5 text-[0.7em] font-semibold text-ink-muted dark:text-zinc-500">{verse.verseNumber}</sup>}
      {flatWords.map((clauseWord, index) => {
        const stateClassName =
          index === wordIndex
            ? "text-brand-700 underline decoration-2 underline-offset-4 dark:text-brand-300"
            : index < wordIndex
              ? "text-ink-muted dark:text-zinc-600"
              : "";
        return (
          <Fragment key={index}>
            {verseMarkers[index] && (
              <>
                <span className="basis-full" />
                <VerseNumberMarker number={verseMarkers[index]} />
              </>
            )}
            <AnnotatedVerseWord word={clauseWord.word} annotation={annotations[index]} className={stateClassName} />{" "}
          </Fragment>
        );
      })}
    </Fragment>
  );

  // Same word-by-word state as activeVerseWords above, sliced to just this ONE clause's own
  // range (see LessonPageCard.tsx's own renderActiveVerse doc comment) — called once per
  // clause so a multi-clause verse still renders through the same hanging-indent line
  // structure a non-active verse gets, not one dense merged block. verseMarkers never fires
  // here in practice (empty for every per-verse phase — see LearnSection.tsx) but the check
  // stays for parity with activeVerseWords above.
  function renderActiveVerseRange(_: VerseSegment, range: SenseLineWordRange) {
    return (
      <Fragment>
        {flatWords.slice(range.startIndex, range.endIndex).map((clauseWord, offset) => {
          const index = range.startIndex + offset;
          const stateClassName =
            index === wordIndex
              ? "text-brand-700 underline decoration-2 underline-offset-4 dark:text-brand-300"
              : index < wordIndex
                ? "text-ink-muted dark:text-zinc-600"
                : "";
          return (
            <Fragment key={index}>
              {verseMarkers[index] && (
                <>
                  <span className="basis-full" />
                  <VerseNumberMarker number={verseMarkers[index]} />
                </>
              )}
              <AnnotatedVerseWord word={clauseWord.word} annotation={annotations[index]} className={stateClassName} />{" "}
            </Fragment>
          );
        })}
      </Fragment>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {layout ? (
        <LessonPageCard layout={layout} activeVerse={verse} activeWordIndex={wordIndex} renderActiveVerse={renderActiveVerseRange} />
      ) : (
        <LessonParchmentCard>
          <p className="font-serif text-lg leading-loose">{activeVerseWords}</p>
        </LessonParchmentCard>
      )}

      <LessonControlBar dockRef={layout?.dockRef} verseText={verse.text} verseMarkers={verseMarkers}>
        <p className="flex items-center gap-1.5 self-center text-caption font-semibold uppercase tracking-wide text-brand-500">
          Learn <InfoTip text={INFO_TIPS.rhythmRep} />
        </p>
        <button
          type="button"
          onClick={advance}
          className="flex h-16 w-full items-center justify-center rounded-2xl border border-line bg-mist/40 text-sm font-medium text-ink-soft dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300"
        >
          Tap for the next word
        </button>
        <AutoCompleteButton onClick={onComplete} />
      </LessonControlBar>
    </div>
  );
}
