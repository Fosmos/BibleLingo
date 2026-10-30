"use client";

import { useState } from "react";
import { ChevronDown, Play } from "lucide-react";
import { findPlacement, newSpot, roomFor } from "@/lib/palacePlacement";
import type { BuiltPalace, VerseSegment } from "@/types";
import type { TrailStop } from "@/lib/trailStops";
import type { StructurePassage } from "@/components/gamification/BookStructureScreen";
import { BookStructureStoryboard, passageShade } from "@/components/gamification/BookStructureStoryboard";
import { PassageSpots } from "@/components/gamification/PassageSpots";
import { VersePictureTile } from "@/components/gamification/VersePictureTile";

// The reader's built palace for the path, with what its spot editors need (BookStructureScreen.tsx).
export interface PalaceContext {
  palace: BuiltPalace;
  pathVerses: VerseSegment[];
  pictureOf: (verse: VerseSegment) => string;
  learnedIds: Set<string>;
  // A verse's spot name in the palace, if it's on one.
  spotOf: (verse: VerseSegment) => string | undefined;
  onSave: (palace: BuiltPalace) => void;
}

interface BookStructureChapterProps {
  chapter: number;
  passages: StructurePassage[];
  open: boolean;
  // The passage you're up to — highlighted in orange, open or not.
  currentIndex?: number;
  built?: PalaceContext;
  onToggle: () => void;
  onStart: (stop: TrailStop) => void;
}

const passageRef = (passage: StructurePassage) => passage.section.ref.replace(/^.*? (\d+:)/, "$1");

// One chapter in the Palace tab (BookStructureScreen.tsx). Closed: its passages, each with its verses'
// picture tiles. Opened: the whole chapter as one storyboard, its passages marked within the grid.
export function BookStructureChapter({ chapter, passages, open, currentIndex, built, onToggle, onStart }: BookStructureChapterProps) {
  if (open) return <ChapterStoryboard chapter={chapter} passages={passages} currentIndex={currentIndex} built={built} onToggle={onToggle} onStart={onStart} />;
  return (
    <div className="grid grid-cols-[34px_minmax(0,1fr)] gap-2.5 pt-3">
      <span className="text-center font-heading text-[26px] leading-none text-sand-700 dark:text-zinc-400">{chapter}</span>
      <div className="flex flex-col gap-2">
        {passages.map((passage) => {
          const current = passage.index === currentIndex;
          return (
            <button key={passage.index} type="button" data-current={current || undefined} onClick={onToggle} aria-label={`Open chapter ${chapter}, ${passage.section.title}`} className={`flex flex-col gap-2 rounded-r-[16px] border-l-2 pb-2 pl-3 pr-1 pt-1.5 text-left ${current ? "border-brand-500 bg-brand-100/60 dark:bg-brand-900/25" : "border-sand-300 dark:border-zinc-700"}`}>
              <span className="flex w-full items-baseline justify-between gap-2">
                <span className={`font-heading text-[16px] leading-snug ${current ? "text-brand-700 dark:text-brand-300" : "text-ink dark:text-zinc-100"}`}>{passage.section.title}</span>
                <span className="flex shrink-0 items-center gap-1 text-[10.5px] font-extrabold text-sand-600 dark:text-zinc-500">
                  {passageRef(passage)}
                  <ChevronDown size={13} strokeWidth={3} />
                </span>
              </span>
              <span className="flex flex-wrap gap-1.5">
                {passage.lessons.map((stop, at) => (
                  <VersePictureTile key={stop.key} pictureId={passage.pictures[at]} verseNumber={stop.verse!.verseNumber} learned={stop.state === "done"} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// The opened chapter: a key naming its passages, then one unbroken grid of its verses, each passage in
// its key's shade (BookStructureStoryboard.tsx). The passage you're up to is orange, with a button under
// the grid to start your next verse; a finished one can be practised from the key. A verse's spot opens for editing under the verse (PassageSpots.tsx) when
// its link is tapped; "Place it" puts the verse on a new spot first.
function ChapterStoryboard({ chapter, passages, currentIndex, built, onToggle, onStart }: Omit<BookStructureChapterProps, "open">) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [spotVerse, setSpotVerse] = useState<VerseSegment | null>(null);
  const next = passages.flatMap((passage) => passage.lessons).find((stop) => stop.state === "current");
  const toggleVerse = (key: string) => {
    setOpenKey(openKey === key ? null : key);
    setSpotVerse(null);
  };
  const openSpot = (verse: VerseSegment) => {
    if (!built) return;
    if (!findPlacement([built.palace], verse)) {
      const ref = { book: verse.book, chapter: verse.chapter, verseNumber: verse.verseNumber };
      built.onSave(newSpot(built.palace, roomFor(built.palace, ref)?.id ?? null, ref, "", ""));
    }
    setSpotVerse(verse);
  };

  return (
    <div className="flex flex-col gap-2 pt-3">
      <button type="button" aria-expanded onClick={onToggle} aria-label={`Close chapter ${chapter}`} className="flex items-center gap-2.5 text-left">
        <span className="w-[34px] text-center font-heading text-[26px] leading-none text-sand-700 dark:text-zinc-400">{chapter}</span>
        <span className="flex-1 text-[11px] font-black uppercase tracking-[.08em] text-sand-700 dark:text-zinc-400">Chapter {chapter}</span>
        <ChevronDown size={15} strokeWidth={3} className="rotate-180 text-sand-600 dark:text-zinc-500" />
      </button>
      <ul className="flex flex-col gap-1">
        {passages.map((passage, position) => {
          const current = passage.index === currentIndex;
          const learned = passage.lessons.every((stop) => stop.state === "done");
          return (
            <li key={passage.index} data-current={current || undefined} className="flex items-center gap-2 px-0.5">
              <span className={`h-3.5 w-3.5 shrink-0 rounded-[4px] border-2 border-l-[4px] ${current ? "border-brand-500" : "border-sand-300 border-l-sand-700 dark:border-zinc-700 dark:border-l-zinc-400"} ${passageShade(position, current)}`} />
              <span className={`min-w-0 flex-1 font-heading text-[15px] leading-snug ${current ? "text-brand-700 dark:text-brand-300" : "text-ink dark:text-zinc-100"}`}>{passage.section.title}</span>
              <span className="flex shrink-0 items-center gap-2 text-[10.5px] font-extrabold text-sand-600 dark:text-zinc-500">
                {learned && (
                  <button type="button" onClick={() => onStart(passage.lessons[0])} className="flex items-center gap-0.5 font-black uppercase tracking-[.04em] text-brand-700 dark:text-brand-300">
                    <Play size={10} strokeWidth={3} />
                    Practise
                  </button>
                )}
                {passageRef(passage)}
              </span>
            </li>
          );
        })}
      </ul>
      <BookStructureStoryboard
        passages={passages}
        currentIndex={currentIndex}
        openKey={openKey}
        onToggle={toggleVerse}
        spotOf={built?.spotOf}
        onSpot={built ? openSpot : undefined}
        editor={built && spotVerse && <PassageSpots palace={built.palace} verse={spotVerse} pathVerses={built.pathVerses} onSave={built.onSave} onDone={() => setSpotVerse(null)} />}
      />
      {next && (
        <button type="button" onClick={() => onStart(next)} className="mt-1 rounded-2xl bg-brand-500 py-3 text-[13px] font-black uppercase tracking-[.06em] text-white shadow-[0_3px_0_#8C491A]">
          Start {next.label}
        </button>
      )}
    </div>
  );
}
