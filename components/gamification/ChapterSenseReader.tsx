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
  // Your next lesson's verses: selecting any of them highlights them all.
  lessonRange: VerseSegment[];
}

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const chapterKey = (at: { book: string; chapter: number }) => `${at.book}|${at.chapter}`;

// The Path tab's chapter reader (design_handoff_bible_progress): chapters in sense lines, grouped by
// pericope, as one continuous scroll (lib/useContinuousChapters.ts), one verse selected with its
// action floating at the bottom. Lessons and reviews run on a page of their own (PathLessonPage.tsx).
export function ChapterSenseReader(props: ChapterSenseReaderProps) {
  const { start, version, pathVerses, statusOf, selected, onSelect, onAction, onBible, onBook, lessonRange } = props;
  const entities = useProgressStore((state) => state.memorizedEntities);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const firstScroll = useRef(true);
  const [loaded, setLoaded] = useState<Record<string, VerseSegment[]>>({});
  const isLoaded = useCallback((at: ChapterRef) => Boolean(loaded[chapterKey(at)]), [loaded]);
  const { chapters, inView, onScroll } = useContinuousChapters(start, scrollRef, contentRef, isLoaded);
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

  // The selected verse ~150px below the top (instantly on entry, smoothly after).
  const target = active ? { book: active.book, chapter: active.chapter, verseNumber: active.verseNumber } : null;
  const targetKey = target ? verseKey(target.book, target.chapter, target.verseNumber) : null;
  const targetLoaded = target ? Boolean(loaded[chapterKey(target)]) : false;
  useEffect(() => {
    if (!targetKey || !targetLoaded) return;
    const frame = requestAnimationFrame(() => {
      const scroller = scrollRef.current;
      const row = scroller?.querySelector<HTMLElement>(`[data-verse-key="${CSS.escape(targetKey)}"]`);
      if (!scroller || !row) return;
      const top = scroller.scrollTop + row.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 150;
      scroller.scrollTo({ top, behavior: firstScroll.current || reducedMotion() ? "auto" : "smooth" });
      firstScroll.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [targetKey, targetLoaded]);

  const activeStatus = active ? statusOf(active.book, active.chapter, active.verseNumber) : "open";
  const covering = active ? entities.filter((entity) => entity.book === active.book && entity.chapter === active.chapter && active.verseNumber >= entity.startVerse && active.verseNumber <= entity.endVerse) : [];

  return (
    <div className="relative flex h-full flex-col">
      <div ref={scrollRef} onScroll={handleScroll} className={`min-h-0 flex-1 overflow-y-auto px-[18px] pt-1.5 [overflow-anchor:none] [scrollbar-width:none] pb-[220px]`}>
        <div ref={contentRef} className="flex flex-col gap-[18px]">
          <ProgressHeader
            crumbs={[{ label: "Bible", onTap: onBible }, { label: inView.book, onTap: () => onBook(inView.book) }, { label: `Chapter ${inView.chapter}` }]}
            eyebrow={`Sense lines · ${version}`}
            title={inView.book}
          />
          {chapters.map((at) => (
            <ReaderChapterSection
              key={chapterKey(at)}
              at={at}
              version={version}
              pathVerses={pathVerses}
              statusOf={(verseNumber) => statusOf(at.book, at.chapter, verseNumber)}
              highlighted={highlightedIn(at)}
              onTap={tap}
              onLoaded={onLoaded}
            />
          ))}
        </div>
      </div>
      {pastHeader && (
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
      {active && (
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
