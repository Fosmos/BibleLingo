"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import type { VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import type { ChapterRef } from "@/lib/adjacentChapter";
import { formatChapterLabel, formatVerseRangeLabel } from "@/lib/chapterContent";
import { useContinuousChapters } from "@/lib/useContinuousChapters";
import { verseKey, type ParsedVerseKey } from "@/lib/verseKey";
import { statusNote, type VerseStatus } from "@/lib/readerVerseStatus";
import { ProgressHeader } from "@/components/gamification/ProgressHeader";
import { ReaderChapterSection } from "@/components/gamification/ReaderChapterSection";
import { ReaderActionBar } from "@/components/gamification/ReaderActionBar";

interface ChapterSenseReaderProps {
  start: ChapterRef;
  version: string;
  pathVerses: VerseSegment[];
  statusOf: (book: string, chapter: number, verseNumber: number) => VerseStatus;
  // Tapped by the reader; null picks the entry verse in the starting chapter.
  selected: ParsedVerseKey | null;
  onSelect: (verse: ParsedVerseKey) => void;
  onAction: (verse: VerseSegment, status: VerseStatus) => void;
  onBible: () => void;
  onBook: (book: string) => void;
  // The verse a lesson or review runs on (its row holds the lesson's verse zone), and which it blanks.
  lessonVerse: ParsedVerseKey | null;
  isHidden: (book: string, chapter: number, verseNumber: number) => boolean;
  // Already typed or said through in this lesson or review — shown in full (not first letters).
  isRecalled: (book: string, chapter: number, verseNumber: number) => boolean;
  // Your next lesson's verses: selecting any of them highlights them all.
  lessonRange: VerseSegment[];
}

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const chapterKey = (at: { book: string; chapter: number }) => `${at.book}|${at.chapter}`;
// How much of the verse before shows above a lesson's verse, at most (about four sense lines).
const LESSON_LEAD_MAX_PX = 150;

// The Path tab's chapter reader (design_handoff_bible_progress): chapters in sense lines, grouped by
// pericope, as one continuous scroll (lib/useContinuousChapters.ts), one verse selected with its
// action floating at the bottom. Lessons and reviews run in place in the verse's own row.
export function ChapterSenseReader(props: ChapterSenseReaderProps) {
  const { start, version, pathVerses, statusOf, selected, onSelect, onAction, onBible, onBook, lessonVerse, isHidden, isRecalled, lessonRange } = props;
  const entities = useProgressStore((state) => state.memorizedEntities);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const firstScroll = useRef(true);
  const lessonRunning = lessonVerse !== null;
  const [loaded, setLoaded] = useState<Record<string, VerseSegment[]>>({});
  const isLoaded = useCallback((at: ChapterRef) => Boolean(loaded[chapterKey(at)]), [loaded]);
  const { chapters, inView, onScroll, ensure } = useContinuousChapters(start, scrollRef, contentRef, !lessonRunning, isLoaded);
  // Once the header (and its breadcrumbs) has scrolled away, a floating button keeps the way back to the book.
  const [pastHeader, setPastHeader] = useState(false);
  const handleScroll = () => {
    onScroll();
    const scrolled = (scrollRef.current?.scrollTop ?? 0) > 140;
    setPastHeader((prev) => (prev === scrolled ? prev : scrolled));
  };
  // Compared by content, not identity — a path chapter's verses can be a fresh array each render.
  const onLoaded = useCallback((at: ChapterRef, verses: VerseSegment[]) => {
    setLoaded((prev) => {
      const had = prev[chapterKey(at)];
      return had && had.length === verses.length && had[0]?.id === verses[0]?.id && had[0]?.text === verses[0]?.text ? prev : { ...prev, [chapterKey(at)]: verses };
    });
  }, []);

  // On entry: the path's next verse in the first chapter, else its first due, else its first not started, else its first.
  const startVerses = loaded[chapterKey(start)] ?? [];
  const entryVerse = (["current", "due", "open"] as const).map((status) => startVerses.find((verse) => statusOf(start.book, start.chapter, verse.verseNumber) === status)).find(Boolean) ?? startVerses[0];
  const [cleared, setCleared] = useState(false);
  const active = cleared ? undefined : selected ? loaded[chapterKey(selected)]?.find((verse) => verse.verseNumber === selected.verseNumber) : entryVerse;
  // A verse of the next lesson stands for the whole lesson: all its verses carry the highlight.
  const inLesson = active && lessonRange.some((verse) => verse.book === active.book && verse.chapter === active.chapter && verse.verseNumber === active.verseNumber);
  const highlighted = active ? (inLesson ? lessonRange : [active]) : [];
  const highlightedIn = (at: ChapterRef) => highlighted.filter((verse) => verse.book === at.book && verse.chapter === at.chapter).map((verse) => verse.verseNumber);
  // Tapping the highlighted verse(s) again clears the highlight and the bar; tapping any verse brings them back.
  const tap = (verse: VerseSegment) => {
    const again = highlighted.some((entry) => entry.book === verse.book && entry.chapter === verse.chapter && entry.verseNumber === verse.verseNumber);
    setCleared(again);
    if (!again) onSelect({ book: verse.book, chapter: verse.chapter, verseNumber: verse.verseNumber });
  };

  // A lesson moving on into another chapter: make sure it's in the scroll.
  useEffect(() => {
    if (lessonVerse) ensure(lessonVerse);
  }, [lessonVerse, ensure]);

  // The selected verse ~150px below the top (instantly on entry, smoothly after). While a lesson or
  // review runs, the verse before it opens the screen under the top bar, then the verse drilled —
  // only the end of a long verse before, so the drilled one stays clear of the dock.
  const target = lessonVerse ?? (active ? { book: active.book, chapter: active.chapter, verseNumber: active.verseNumber } : null);
  const targetKey = target ? verseKey(target.book, target.chapter, target.verseNumber) : null;
  const targetLoaded = target ? Boolean(loaded[chapterKey(target)]) : false;
  useEffect(() => {
    if (!targetKey || !targetLoaded) return;
    const frame = requestAnimationFrame(() => {
      const scroller = scrollRef.current;
      const row = scroller?.querySelector<HTMLElement>(`[data-verse-key="${CSS.escape(targetKey)}"]`);
      if (!scroller || !row) return;
      const rows = [...scroller.querySelectorAll<HTMLElement>("[data-verse-key]")];
      const before = lessonRunning ? rows[rows.indexOf(row) - 1] : undefined;
      const lead = lessonRunning ? 64 + Math.min(before?.offsetHeight ?? 0, LESSON_LEAD_MAX_PX) : 150;
      const top = scroller.scrollTop + row.getBoundingClientRect().top - scroller.getBoundingClientRect().top - lead;
      scroller.scrollTo({ top, behavior: firstScroll.current || reducedMotion() ? "auto" : "smooth" });
      firstScroll.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [targetKey, targetLoaded, lessonRunning]);

  const activeStatus = active ? statusOf(active.book, active.chapter, active.verseNumber) : "open";
  const covering = active ? entities.filter((entity) => entity.book === active.book && entity.chapter === active.chapter && active.verseNumber >= entity.startVerse && active.verseNumber <= entity.endVerse) : [];

  return (
    <div className="relative flex h-full flex-col">
      <div ref={scrollRef} onScroll={handleScroll} className={`min-h-0 flex-1 overflow-y-auto px-[18px] pt-1.5 [overflow-anchor:none] [scrollbar-width:none] ${lessonRunning ? "pb-[70dvh]" : "pb-[220px]"}`}>
        <div ref={contentRef} className="flex flex-col gap-[18px]">
          {!lessonRunning && (
            <ProgressHeader
              crumbs={[{ label: "Bible", onTap: onBible }, { label: inView.book, onTap: () => onBook(inView.book) }, { label: `Chapter ${inView.chapter}` }]}
              eyebrow={`Sense lines · ${version}`}
              title={inView.book}
            />
          )}
          {chapters.map((at) => (
            <ReaderChapterSection
              key={chapterKey(at)}
              at={at}
              version={version}
              pathVerses={pathVerses}
              statusOf={(verseNumber) => statusOf(at.book, at.chapter, verseNumber)}
              highlighted={highlightedIn(at)}
              onTap={tap}
              lessonVerse={lessonVerse && chapterKey(lessonVerse) === chapterKey(at) ? lessonVerse.verseNumber : null}
              duringLesson={lessonRunning}
              isHidden={(verseNumber) => isHidden(at.book, at.chapter, verseNumber)}
              isRecalled={(verseNumber) => isRecalled(at.book, at.chapter, verseNumber)}
              onLoaded={onLoaded}
            />
          ))}
        </div>
      </div>
      {!lessonRunning && pastHeader && (
        <button
          type="button"
          onClick={() => onBook(inView.book)}
          aria-label={`Back to ${inView.book}`}
          className="absolute left-3 top-[calc(0.5rem+env(safe-area-inset-top))] z-[5] flex items-center gap-1 rounded-full border border-sand-200 bg-[#FEFDFB]/95 py-2 pl-2 pr-3.5 text-[13px] font-extrabold text-ink shadow-organic-md backdrop-blur-sm hover:bg-sand-100 dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-100"
        >
          <ChevronLeft size={18} strokeWidth={2.75} />
          {inView.book}
        </button>
      )}
      {!lessonRunning && active && (
        <ReaderActionBar
          reference={highlighted.length > 1 ? formatVerseRangeLabel(highlighted) : `${formatChapterLabel(active.book, active.chapter)}:${active.verseNumber}`}
          status={activeStatus}
          note={statusNote(activeStatus, covering)}
          onAction={() => onAction(active, activeStatus)}
        />
      )}
    </div>
  );
}
