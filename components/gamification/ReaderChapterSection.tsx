"use client";

import { useEffect } from "react";
import type { VerseSegment } from "@/types";
import type { ChapterRef } from "@/lib/adjacentChapter";
import { formatChapterLabel } from "@/lib/chapterContent";
import { chapterPathVerses } from "@/lib/chapterPathVerses";
import { useChapterText } from "@/lib/useChapterText";
import { useReaderGroups } from "@/lib/useReaderGroups";
import { verseKey } from "@/lib/verseKey";
import type { VerseStatus } from "@/lib/readerVerseStatus";
import { ReaderVerseRow } from "@/components/gamification/ReaderVerseRow";
import { ReaderProseRun } from "@/components/gamification/ReaderProseRun";
import { useProgressStore } from "@/store/useProgressStore";
import { sealTier } from "@/lib/srsSeals";

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
}

function runPosition(run: number[], verseNumber: number): "single" | "first" | "middle" | "last" {
  const before = run.includes(verseNumber - 1);
  const after = run.includes(verseNumber + 1);
  return before && after ? "middle" : before ? "last" : after ? "first" : "single";
}

// One chapter in the continuous reader (ChapterSenseReader.tsx): its title, then its pericopes in
// sense lines — or, with sense lines off ("Learn line by line" off), as continuous paragraphs
// (ReaderProseRun.tsx) — the path's own chapters straight from its verses, any other fetched in `version`.
export function ReaderChapterSection({ at, version, pathVerses, statusOf, highlighted, onTap, lessonVerse, duringLesson, isHidden, isRecalled, onLoaded }: ReaderChapterSectionProps) {
  const entities = useProgressStore((state) => state.memorizedEntities);
  const prose = useProgressStore((state) => state.wholeVerseLearning) ?? false;
  const onPath = pathVerses.some((verse) => verse.book === at.book && verse.chapter === at.chapter);
  const loaded = useChapterText(at.book, at.chapter, version, onPath);
  const verses = onPath ? chapterPathVerses(pathVerses, at.book, at.chapter, version) : loaded.verses;
  const groups = useReaderGroups(at.book, at.chapter, verses ?? []);
  useEffect(() => {
    if (verses?.length) onLoaded(at, verses);
  }, [verses, at, onLoaded]);

  const row = (verse: VerseSegment) => (
    <ReaderVerseRow
      key={verse.verseNumber}
      rowKey={verseKey(at.book, at.chapter, verse.verseNumber)}
      verse={verse}
      status={statusOf(verse.verseNumber)}
      selected={!duringLesson && highlighted.includes(verse.verseNumber)}
      run={runPosition(highlighted, verse.verseNumber)}
      onSelect={() => onTap(verse)}
      hostsLesson={lessonVerse === verse.verseNumber}
      duringLesson={duringLesson}
      hidden={isHidden(verse.verseNumber)}
      recalled={isRecalled(verse.verseNumber)}
      seal={sealTier(entities, { book: at.book, chapter: at.chapter, startVerse: verse.verseNumber, endVerse: verse.verseNumber })}
    />
  );

  return (
    <section data-chapter={`${at.book}|${at.chapter}`} className="flex flex-col gap-[18px]">
      <h2 className="px-3.5 pt-3 font-heading text-[30px] leading-none text-ink dark:text-zinc-100">{formatChapterLabel(at.book, at.chapter)}</h2>
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
            <span className="text-[11px] font-extrabold uppercase tracking-[.06em] text-sage-800 dark:text-sage-300">{group.range}</span>
            <h3 className="font-heading text-[21px] leading-tight text-ink dark:text-zinc-100">{group.heading}</h3>
          </div>
          <div className="-mx-1 flex flex-col">
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
              group.verses.map(row)
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
