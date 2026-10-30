"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { buildBookGrid } from "@/lib/bookGrid";
import type { TrailSection, TrailStop } from "@/lib/trailStops";
import type { TrailTag } from "@/lib/trailTags";
import { BookGridChapter } from "@/components/gamification/BookGridChapter";
import { VerseStatusDetail } from "@/components/gamification/VerseStatusDetail";
import { TrailNodeSheet } from "@/components/gamification/TrailNodeSheet";
import { TrailTagRow } from "@/components/gamification/TrailTagRow";
import { PathViewSwitch } from "@/components/ui/PathViewSwitch";

interface BookGridScreenProps {
  label: string;
  sections: TrailSection[];
  headerTags: TrailTag[];
  tagsFor?: (section: TrailSection) => TrailTag[];
  onStart: (stop: TrailStop) => void;
  onPractise: (stop: TrailStop) => void;
  onReview: (ids: string[]) => void;
}

// The Path tab for a book or chapter: its chapters as a plain list, the one you're on open with each
// passage's verses as dots. A dot's shade is its strength, and tapping it gives its dates and tags.
// Continue and Review stay just above the tab bar.
export function BookGridScreen({ label, sections, headerTags, tagsFor, onStart, onPractise, onReview }: BookGridScreenProps) {
  const entities = useProgressStore((state) => state.memorizedEntities);
  const stumbles = useProgressStore((state) => state.wordStumbleCounts);
  const grid = useMemo(() => buildBookGrid(sections, entities, stumbles), [sections, entities, stumbles]);
  const [openChapter, setOpenChapter] = useState<number | null>(() => grid.chapters.find((chapter) => chapter.hasNext)?.chapter ?? grid.chapters.find((chapter) => chapter.due)?.chapter ?? grid.chapters[0]?.chapter ?? null);
  const [sheet, setSheet] = useState<TrailStop | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  // A chapter that opens starts at the top of the list, with its tiles in full view.
  useEffect(() => {
    scroller.current?.querySelector(`[data-chapter="${openChapter}"]`)?.scrollIntoView({ block: "start" });
  }, [openChapter]);
  const tiles = grid.chapters.flatMap((chapter) => chapter.tiles);
  const tile = sheet && tiles.find((candidate) => candidate.stop.key === sheet.key);
  const sheetSection = sheet && sections.find((section) => section.stops.some((candidate) => candidate.key === sheet.key));

  return (
    <div className="-mb-28 flex h-[100dvh] w-full flex-col">
      <header className="flex shrink-0 flex-col px-4 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          <Link href="/" aria-label="Back to your paths" className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] text-sand-600 hover:bg-sand-100 dark:text-zinc-400 dark:hover:bg-zinc-900">
            <ArrowLeft size={20} strokeWidth={2.75} />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-heading text-[26px] leading-none text-ink dark:text-zinc-100">{label}</span>
            <span className="truncate pt-1 text-[13px] font-semibold text-ink-muted">{grid.known} of {grid.total} verses</span>
          </div>
          <PathViewSwitch className="shrink-0" />
        </div>
      </header>
      <div ref={scroller} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-[170px] [scrollbar-width:none]">
        {grid.chapters.map((chapter) => (
          <BookGridChapter key={chapter.chapter} chapter={chapter} open={openChapter === chapter.chapter} onToggle={() => setOpenChapter(openChapter === chapter.chapter ? null : chapter.chapter)} onTapStop={setSheet} />
        ))}
        {grid.finale.map((stop) => (
          <button key={stop.key} type="button" onClick={() => setSheet(stop)} className="mt-2 rounded-full bg-sand-200 py-3 text-sm font-extrabold text-ink dark:bg-zinc-800 dark:text-zinc-100">
            {stop.title}
          </button>
        ))}
      </div>
      {(grid.next || grid.dueIds.length > 0) && (
        <div className="absolute inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] mx-auto flex max-w-md gap-2">
          {grid.next && (
            <button type="button" onClick={() => onStart(grid.next!)} className="flex min-w-0 flex-1 items-center justify-center rounded-full bg-brand-500 py-3.5 text-[15px] font-extrabold text-white shadow-organic-md">
              <span className="truncate">Continue: {grid.next.label}</span>
            </button>
          )}
          {grid.dueIds.length > 0 && (
            <button type="button" onClick={() => onReview(grid.dueIds)} className="flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-sand-200 px-5 py-3.5 text-[15px] font-extrabold text-ink shadow-organic-md dark:bg-zinc-800 dark:text-zinc-100">
              Review {grid.dueIds.length}
            </button>
          )}
        </div>
      )}
      {sheet && (
        <TrailNodeSheet stop={sheet} sectionTitle={sheetSection?.title ?? ""} pathLabel={label} onClose={() => setSheet(null)} onStart={() => onStart(sheet)} onReview={() => onReview(sheet.dueIds)} onPractise={() => onPractise(sheet)}>
          {tile && <VerseStatusDetail entity={tile.entity} strength={tile.strength} />}
          <TrailTagRow tags={[...headerTags, ...(sheetSection && tagsFor ? tagsFor(sheetSection) : [])]} />
        </TrailNodeSheet>
      )}
    </div>
  );
}
