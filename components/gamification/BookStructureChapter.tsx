"use client";

import { useState } from "react";
import { ChevronDown, Play } from "lucide-react";
import { findPlacement, newSpot, roomFor } from "@/lib/palacePlacement";
import { pericopeNumber, pericopeTone } from "@/lib/pericopeTones";
import type { BuiltPalace, VerseSegment } from "@/types";
import type { TrailStop } from "@/lib/trailStops";
import type { StructurePassage } from "@/components/gamification/BookStructureScreen";
import { BookStructureStoryboard } from "@/components/gamification/BookStructureStoryboard";
import { PassageSpots } from "@/components/gamification/PassageSpots";

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

// One chapter in the Palace tab (BookStructureScreen.tsx): all its verses in one storyboard, its
// passages marked within the grid by colour (BookStructureStoryboard.tsx), the same closed or open.
// Open — tap a panel — it adds a key naming the passages (a finished one can be practised from there), the
// tapped verse under its row, and a button to start your next verse. A verse's spot opens for editing
// under the verse (PassageSpots.tsx) when its link is tapped; "Place it" puts it on a new spot first.
export function BookStructureChapter({ chapter, passages, open, currentIndex, built, onToggle, onStart }: BookStructureChapterProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [spotVerse, setSpotVerse] = useState<VerseSegment | null>(null);
  const next = passages.flatMap((passage) => passage.lessons).find((stop) => stop.state === "current");
  const toggleVerse = (key: string) => {
    if (!open) onToggle();
    setOpenKey(open && openKey === key ? null : key);
    setSpotVerse(null);
  };
  const toggleChapter = () => {
    setOpenKey(null);
    setSpotVerse(null);
    onToggle();
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
      <button type="button" aria-expanded={open} onClick={toggleChapter} aria-label={`${open ? "Close" : "Open"} chapter ${chapter}`} className="flex items-center gap-2.5 text-left">
        <span className="w-[34px] text-center font-heading text-[26px] leading-none text-sand-700 dark:text-zinc-400">{chapter}</span>
        <span className="flex-1 text-[11px] font-black uppercase tracking-[.08em] text-sand-700 dark:text-zinc-400">Chapter {chapter}</span>
        <ChevronDown size={15} strokeWidth={3} className={`text-sand-600 transition-transform dark:text-zinc-500 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="flex flex-col gap-1">
          {passages.map((passage, position) => {
            const current = passage.index === currentIndex;
            const learned = passage.lessons.every((stop) => stop.state === "done");
            const tone = pericopeTone(pericopeNumber(passage.lessons[0].verse!.book, chapter, passage.lessons[0].verse!.verseNumber, position), current);
            return (
              <li key={passage.index} data-current={current || undefined} className="flex items-center gap-2 px-0.5">
                <span className={`h-3.5 w-3.5 shrink-0 rounded-[4px] border-l-[4px] ${tone.fill} ${tone.bar}`} />
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
      )}
      <BookStructureStoryboard
        passages={passages}
        currentIndex={currentIndex}
        openKey={open ? openKey : null}
        onToggle={toggleVerse}
        spotOf={built?.spotOf}
        onSpot={built ? openSpot : undefined}
        editor={built && spotVerse && <PassageSpots palace={built.palace} verse={spotVerse} pathVerses={built.pathVerses} onSave={built.onSave} onDone={() => setSpotVerse(null)} />}
      />
      {open && next && (
        <button type="button" onClick={() => onStart(next)} className="mt-1 rounded-2xl bg-brand-500 py-3 text-[13px] font-black uppercase tracking-[.06em] text-white shadow-[0_3px_0_#8C491A]">
          Start {next.label}
        </button>
      )}
    </div>
  );
}
