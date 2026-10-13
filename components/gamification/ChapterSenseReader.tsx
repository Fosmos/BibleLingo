"use client";

import { useEffect, useMemo, useRef } from "react";
import type { VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { formatChapterLabel } from "@/lib/chapterContent";
import { useReaderGroups } from "@/lib/useReaderGroups";
import { statusNote, type VerseStatus } from "@/lib/readerVerseStatus";
import { ProgressHeader } from "@/components/gamification/ProgressHeader";
import { ReaderVerseRow } from "@/components/gamification/ReaderVerseRow";
import { ReaderActionBar } from "@/components/gamification/ReaderActionBar";

interface ChapterSenseReaderProps {
  book: string;
  chapter: number;
  version: string;
  verses: VerseSegment[];
  statusOf: (verseNumber: number) => VerseStatus;
  // Tapped by the reader; null picks the entry verse (see `entryVerse`).
  selected: number | null;
  onSelect: (verseNumber: number) => void;
  onAction: (verse: VerseSegment, status: VerseStatus) => void;
  onBible: () => void;
  onBook: () => void;
  // The verse a lesson or review runs on (its row holds the lesson's verse zone), and which it blanks.
  lessonVerse: number | null;
  isHidden: (verseNumber: number) => boolean;
}

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// The Path tab's chapter reader (design_handoff_bible_progress): the whole chapter in sense lines,
// grouped by pericope, one verse selected with its action pinned at the bottom. Lessons and reviews
// run in place in the verse's own row, controls docked below (ChapterPathScreen.tsx).
export function ChapterSenseReader(props: ChapterSenseReaderProps) {
  const { book, chapter, version, verses, statusOf, selected, onSelect, onAction, onBible, onBook, lessonVerse, isHidden } = props;
  const entities = useProgressStore((state) => state.memorizedEntities);
  const groups = useReaderGroups(book, chapter, verses);
  const scrollRef = useRef<HTMLDivElement>(null);
  const firstScroll = useRef(true);
  const shown = useMemo(() => groups.flatMap((group) => group.verses), [groups]);
  // On entry: the path's next verse here, else the first due, else the first not started, else the first.
  const entryVerse = (["current", "due", "open"] as const).map((status) => shown.find((verse) => statusOf(verse.verseNumber) === status)).find(Boolean) ?? shown[0];
  const active = shown.find((verse) => verse.verseNumber === selected) ?? entryVerse;
  const lessonRunning = lessonVerse !== null;

  // The selected verse ~150px below the top (instantly on entry, smoothly after); a lesson's verse just under its top bar.
  const target = lessonVerse ?? active?.verseNumber;
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const scroller = scrollRef.current;
      const row = scroller?.querySelector<HTMLElement>(`[data-verse="${target}"]`);
      if (!scroller || !row) return;
      const top = scroller.scrollTop + row.getBoundingClientRect().top - scroller.getBoundingClientRect().top - (lessonRunning ? 64 : 150);
      scroller.scrollTo({ top, behavior: firstScroll.current || reducedMotion() ? "auto" : "smooth" });
      firstScroll.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [target, lessonRunning, groups.length]);

  const activeStatus = active ? statusOf(active.verseNumber) : "open";
  const covering = active ? entities.filter((entity) => entity.book === book && entity.chapter === chapter && active.verseNumber >= entity.startVerse && active.verseNumber <= entity.endVerse) : [];

  return (
    <div className="relative flex h-full flex-col">
      <div ref={scrollRef} className={`flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-[18px] pt-1.5 [overflow-anchor:none] [scrollbar-width:none] ${lessonRunning ? "pb-[70dvh]" : "pb-[220px]"}`}>
        {!lessonRunning && (
          <ProgressHeader crumbs={[{ label: "Bible", onTap: onBible }, { label: book, onTap: onBook }, { label: `Chapter ${chapter}` }]} eyebrow={`Sense lines · ${version}`} title={formatChapterLabel(book, chapter)} />
        )}
        {groups.map((group) => (
          <section key={group.key} className="flex flex-col">
            <div className="flex flex-col gap-0.5 px-3.5 pb-1.5 pt-1">
              <span className="text-[11px] font-extrabold uppercase tracking-[.06em] text-sage-800 dark:text-sage-300">{group.range}</span>
              <h2 className="font-heading text-[21px] leading-tight text-ink dark:text-zinc-100">{group.heading}</h2>
            </div>
            <div className="-mx-1 flex flex-col">
              {group.verses.map((verse) => (
                <ReaderVerseRow
                  key={verse.verseNumber}
                  verse={verse}
                  status={statusOf(verse.verseNumber)}
                  selected={!lessonRunning && verse.verseNumber === active?.verseNumber}
                  onSelect={() => onSelect(verse.verseNumber)}
                  hostsLesson={lessonVerse === verse.verseNumber}
                  duringLesson={lessonRunning}
                  hidden={isHidden(verse.verseNumber)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
      {!lessonRunning && active && (
        <ReaderActionBar
          reference={`${formatChapterLabel(book, chapter)}:${active.verseNumber}`}
          status={activeStatus}
          note={statusNote(activeStatus, covering)}
          onAction={() => onAction(active, activeStatus)}
        />
      )}
    </div>
  );
}
