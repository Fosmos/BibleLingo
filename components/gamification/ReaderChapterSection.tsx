"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import type { BuiltPalace, VerseSegment } from "@/types";
import type { ChapterRef } from "@/lib/adjacentChapter";
import { formatChapterLabel } from "@/lib/chapterContent";
import { chapterLoci, type ChapterLocus } from "@/lib/chapterLoci";
import { chapterPathVerses } from "@/lib/chapterPathVerses";
import { useChapterText } from "@/lib/useChapterText";
import { useReaderGroups } from "@/lib/useReaderGroups";
import { verseKey } from "@/lib/verseKey";
import type { VerseStatus } from "@/lib/readerVerseStatus";
import { ReaderVerseRow } from "@/components/gamification/ReaderVerseRow";
import { AddLocusButton } from "@/components/gamification/AddLocusButton";
import { ReaderLocusSheet } from "@/components/gamification/ReaderLocusSheet";
import { ReaderLocusTag } from "@/components/gamification/ReaderLocusTag";
import { ReaderProseRun } from "@/components/gamification/ReaderProseRun";
import { useProgressStore } from "@/store/useProgressStore";

interface ReaderChapterSectionProps {
  at: ChapterRef;
  version: string;
  // The active path's verses — used as-is for its own chapters; any other chapter is loaded.
  pathVerses: VerseSegment[];
  statusOf: (verseNumber: number) => VerseStatus;
  // Highlighted verse numbers in this chapter (the selection, or the whole next lesson).
  highlighted: number[];
  onTap: (verse: VerseSegment) => void;
  // The verse here a lesson runs on, if any; whether a lesson runs anywhere; which verses it blanks.
  lessonVerse: number | null;
  duringLesson: boolean;
  isHidden: (verseNumber: number) => boolean;
  isRecalled: (verseNumber: number) => boolean;
  onLoaded: (at: ChapterRef, verses: VerseSegment[]) => void;
  // The action bar asked for the selected verse's locus sheet.
  locusOpen: boolean;
  onLocusClosed: () => void;
}

const NO_PALACES: BuiltPalace[] = [];

function runPosition(run: number[], verseNumber: number): "single" | "first" | "middle" | "last" {
  const before = run.includes(verseNumber - 1);
  const after = run.includes(verseNumber + 1);
  return before && after ? "middle" : before ? "last" : after ? "first" : "single";
}

// One chapter in the continuous reader (ChapterSenseReader.tsx): its title (with its memory palace room), then its pericopes — in sense lines — or, with sense lines off ("Learn line by line" off), as continuous paragraphs
// (ReaderProseRun.tsx) — the path's own chapters straight from its verses, any other fetched in `version`.
export function ReaderChapterSection({ at, version, pathVerses, statusOf, highlighted, onTap, lessonVerse, duringLesson, isHidden, isRecalled, onLoaded, locusOpen, onLocusClosed }: ReaderChapterSectionProps) {
  const prose = useProgressStore((state) => state.wholeVerseLearning) ?? false;
  const onPath = pathVerses.some((verse) => verse.book === at.book && verse.chapter === at.chapter);
  const loaded = useChapterText(at.book, at.chapter, version, onPath);
  const verses = onPath ? chapterPathVerses(pathVerses, at.book, at.chapter, version) : loaded.verses;
  const groups = useReaderGroups(at.book, at.chapter, verses ?? []);
  useEffect(() => {
    if (verses?.length) onLoaded(at, verses);
  }, [verses, at, onLoaded]);

  const palaces = useProgressStore((state) => state.builtPalaces) ?? NO_PALACES;
  const loci = useMemo(() => chapterLoci(palaces, at.book, at.chapter), [palaces, at.book, at.chapter]);
  const [locusSheet, setLocusSheet] = useState<{ editing?: ChapterLocus } | null>(null);
  const realVerses = (verses ?? []).filter((verse) => verse.text.trim());
  const lastVerse = realVerses[realVerses.length - 1]?.verseNumber ?? 0;
  const room = loci[0]?.room.name;
  const tagOf = (entry: ChapterLocus) => <ReaderLocusTag key={entry.locus.id} entry={entry} lastVerse={lastVerse} onTap={duringLesson ? undefined : () => setLocusSheet({ editing: entry })} />;

  const row = (verse: VerseSegment) => (
    <ReaderVerseRow
      key={verse.verseNumber}
      rowKey={verseKey(at.book, at.chapter, verse.verseNumber)}
      verse={verse}
      selected={!duringLesson && highlighted.includes(verse.verseNumber)}
      run={runPosition(highlighted, verse.verseNumber)}
      onSelect={() => onTap(verse)}
      hostsLesson={lessonVerse === verse.verseNumber}
      duringLesson={duringLesson}
      hidden={isHidden(verse.verseNumber)}
      recalled={isRecalled(verse.verseNumber)}
      held={!["open", "current"].includes(statusOf(verse.verseNumber))}
    />
  );

  return (
    <section data-chapter={`${at.book}|${at.chapter}`} className="flex flex-col gap-[18px]">
      <div className="flex items-start gap-2 px-3.5 pt-3">
        <h2 className="min-w-0 flex-1 font-heading text-[30px] leading-none text-ink dark:text-zinc-100">
          {formatChapterLabel(at.book, at.chapter)}
          {room ? ` - ${room}` : ""}
        </h2>
        {!duringLesson && realVerses.length > 0 && <AddLocusButton onTap={() => setLocusSheet({})} className="-mt-1.5" />}
      </div>
      {loaded.error && <p className="px-3.5 text-sm font-semibold text-sand-700">{loaded.error}</p>}
      {!verses && !loaded.error && (
        <div aria-hidden="true" className="flex flex-col gap-3 px-3.5">
          {[0, 1, 2, 3].map((line) => (
            <span key={line} className="h-4 w-4/5 animate-pulse rounded-full bg-sand-200 dark:bg-zinc-800" />
          ))}
        </div>
      )}
      {groups.map((group) => (
        <div key={group.key} className="flex flex-col">
          <div className="flex flex-col gap-0.5 px-3.5 pb-1.5 pt-1">
            <span className="text-[11px] font-extrabold uppercase tracking-[.06em] text-sand-700 dark:text-zinc-400">{group.range}</span>
            <h3 className="font-heading text-[21px] leading-tight text-ink dark:text-zinc-100">{group.heading}</h3>
          </div>
          <div className="-mx-1 flex flex-col">
            {prose && loci.filter((entry) => group.verses.some((verse) => verse.verseNumber === entry.from)).map(tagOf)}
            {prose ? (
              <ReaderProseRun
                book={at.book}
                chapter={at.chapter}
                verses={group.verses}
                statusOf={statusOf}
                isSelected={(verseNumber) => !duringLesson && highlighted.includes(verseNumber)}
                onTap={onTap}
                duringLesson={duringLesson}
                isHidden={isHidden}
                isRecalled={isRecalled}
                lessonVerse={lessonVerse}
              />
            ) : (
              group.verses.map((verse) => (
                <Fragment key={verse.verseNumber}>
                  {loci.filter((entry) => entry.from === verse.verseNumber).map(tagOf)}
                  {row(verse)}
                </Fragment>
              ))
            )}
          </div>
        </div>
      ))}
      {(locusSheet || locusOpen) && (
        <ReaderLocusSheet
          book={at.book}
          chapter={at.chapter}
          verses={realVerses}
          loci={loci}
          editing={locusSheet ? locusSheet.editing : loci.find((entry) => highlighted[0] >= entry.from && highlighted[0] <= entry.to)}
          startVerse={highlighted[0]}
          onClose={() => {
            setLocusSheet(null);
            onLocusClosed();
          }}
        />
      )}
    </section>
  );
}
