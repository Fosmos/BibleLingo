"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { TrailSection, TrailStop } from "@/lib/trailStops";
import { BOOK_THEMES } from "@/lib/bookThemes";
import { formatChapterLabel } from "@/lib/chapterContent";
import { buildRingBook, type RingVerse } from "@/lib/verseRings";
import { passagePictures } from "@/lib/verseImages";
import { usePalaceContext } from "@/lib/usePalaceContext";
import { useProgressStore } from "@/store/useProgressStore";
import { BookStructureBook } from "@/components/gamification/BookStructureBook";
import { BookStructureChapter } from "@/components/gamification/BookStructureChapter";
import { TrailNodeSheet } from "@/components/gamification/TrailNodeSheet";
import { VerseSpotLink } from "@/components/gamification/VerseSpotLink";
import { VerseStatusDetail } from "@/components/gamification/VerseStatusDetail";
import { RingKey } from "@/components/gamification/VerseRing";
import { PalaceBuiltPanel } from "@/components/gamification/PalaceBuiltPanel";

interface BookStructureScreenProps {
  pathKey: string;
  pathLabel: string;
  // The book's name, for its themes (lib/bookThemes.ts) — unset for a path that isn't one book.
  book?: string;
  sections: TrailSection[];
  // Start (or practise) a lesson — it runs in the reader (PathTrailScreen.tsx).
  onStart: (stop: TrailStop) => void;
  onReview: (ids: string[]) => void;
}

export interface StructurePassage {
  index: number;
  section: TrailSection;
  chapter: number;
  lessons: TrailStop[];
  pictures: string[];
}

// Where a lesson begun in a chapter comes back to, for the screen's next opening.
const RETURN_KEY = "verses:palaceReturn";
const readReturn = (pathKey: string): number | null => {
  try {
    const [key, chapter] = (sessionStorage.getItem(RETURN_KEY) ?? "").split("#");
    return key === pathKey && chapter ? Number(chapter) : null;
  } catch {
    return null;
  }
};
const writeReturn = (value: string | null) => {
  try {
    if (value) sessionStorage.setItem(RETURN_KEY, value);
    else sessionStorage.removeItem(RETURN_KEY);
  } catch {
    // Without storage the lesson just comes back to the whole book.
  }
};

// The Palace tab: the whole book, its chapters as boxes under its themes, with the real place the
// reader is building a palace in on top (PalaceBuiltPanel.tsx). Tapping a chapter opens it: its
// pericopes in the margin, its verses as boxes (BookStructureChapter.tsx). Tapping a verse gives its
// strength, review dates and palace spot. A filled box's colour is how close its review is (lib/verseRings.ts).
export function BookStructureScreen({ pathKey, pathLabel, book, sections, onStart, onReview }: BookStructureScreenProps) {
  const chosen = useProgressStore((state) => state.iconTags);
  const entities = useProgressStore((state) => state.memorizedEntities);
  const stumbles = useProgressStore((state) => state.wordStumbleCounts);
  const passages = useMemo<StructurePassage[]>(
    () =>
      sections.flatMap((section, index) => {
        const lessons = section.stops.filter((stop) => stop.verse);
        const first = lessons[0]?.verse;
        if (section.review || !first) return [];
        return [{ index, section, chapter: first.chapter, lessons, pictures: passagePictures(lessons.map((stop) => stop.verse!), chosen) }];
      }),
    [sections, chosen],
  );
  const rings = useMemo(() => buildRingBook(passages, entities, stumbles, new Date()), [passages, entities, stumbles]);
  const single = rings.chapters.length === 1 ? rings.chapters[0].chapter : null;
  const [chosenChapter, setChosenChapter] = useState<number | null>(() => readReturn(pathKey));
  const openNumber = single ?? chosenChapter;
  const chapter = rings.chapters.find((entry) => entry.chapter === openNumber);
  const [sheet, setSheet] = useState<RingVerse | null>(null);
  const built = usePalaceContext(pathKey, passages);
  const saveBuiltPalace = useProgressStore((state) => state.saveBuiltPalace);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => writeReturn(null), []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    scrollRef.current?.querySelector("[data-next]")?.scrollIntoView({ block: "center" });
  }, [openNumber]);
  const leaving = (target: number | undefined) => writeReturn(target === undefined ? null : `${pathKey}#${target}`);
  const start = (stop: TrailStop) => {
    leaving(stop.verse?.chapter);
    onStart(stop);
  };
  const sectionOf = (ring: RingVerse) => sections.find((section) => section.stops.includes(ring.stop))?.title ?? "";
  const themes = (book && BOOK_THEMES[book]) || [];
  const back = "-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] text-sand-600 hover:bg-sand-100 dark:text-zinc-400 dark:hover:bg-zinc-900";
  const nextHere = chapter ? chapter.hasNext : rings.next !== null;

  return (
    <div className="-mb-28 flex h-[100dvh] w-full flex-col">
      <header className="flex shrink-0 items-center gap-2 px-4 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        {chapter && single === null ? (
          <button type="button" aria-label={`Back to ${pathLabel}`} onClick={() => setChosenChapter(null)} className={back}>
            <ArrowLeft size={20} strokeWidth={2.75} />
          </button>
        ) : (
          <Link href="/" aria-label="Back to your paths" className={back}>
            <ArrowLeft size={20} strokeWidth={2.75} />
          </Link>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-heading text-[24px] leading-none text-ink dark:text-zinc-100">{chapter ? formatChapterLabel(chapter.book, chapter.chapter) : pathLabel}</span>
          <span className="truncate pt-1 text-xs font-bold text-ink-muted">
            {chapter ? `${chapter.known} of ${chapter.total}` : `${rings.known} of ${rings.total}`} verses{rings.today > 0 && (!chapter || chapter.hasToday) ? ` · ${rings.today} today` : ""}
          </span>
        </div>
      </header>
      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-[170px] pt-1 [scrollbar-width:none]">
        {!chapter && <PalaceBuiltPanel pathKey={pathKey} palace={built?.palace} onSave={saveBuiltPalace} />}
        {chapter ? <BookStructureChapter chapter={chapter} onTapVerse={setSheet} /> : <BookStructureBook chapters={rings.chapters} themes={themes} onOpen={setChosenChapter} />}
        <RingKey />
      </div>
      {nextHere && rings.next && (
        <div className="absolute inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] mx-auto max-w-md">
          <button type="button" onClick={() => (chapter ? start(rings.next!.stop) : setChosenChapter(rings.next!.verse.chapter))} className="w-full rounded-full bg-brand-500 py-3.5 text-[15px] font-extrabold text-white shadow-organic-md">
            {chapter ? `Start ${rings.next.stop.label}` : `Continue in chapter ${rings.next.verse.chapter}`}
          </button>
        </div>
      )}
      {sheet && (
        <TrailNodeSheet
          stop={sheet.stop}
          sectionTitle={sectionOf(sheet)}
          pathLabel={pathLabel}
          onClose={() => setSheet(null)}
          onStart={() => start(sheet.stop)}
          onReview={() => {
            leaving(sheet.verse.chapter);
            onReview(sheet.stop.dueIds);
          }}
          onPractise={() => start(sheet.stop)}
        >
          <VerseStatusDetail entity={sheet.entity} strength={sheet.strength} />
          {built && <VerseSpotLink key={sheet.verse.id} built={built} verse={sheet.verse} />}
        </TrailNodeSheet>
      )}
    </div>
  );
}
