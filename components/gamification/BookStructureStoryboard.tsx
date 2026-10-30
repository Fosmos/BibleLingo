"use client";

import { Fragment, type CSSProperties, type ReactNode } from "react";
import { MapPin, Plus } from "lucide-react";
import type { VerseSegment } from "@/types";
import type { StructurePassage } from "@/components/gamification/BookStructureScreen";
import { pictureById } from "@/lib/verseImages";
import { parseToSenseLines } from "@/lib/senseLines";
import { pericopeNumber, pericopeTone } from "@/lib/pericopeTones";

interface BookStructureStoryboardProps {
  // The chapter's passages, in order, and the one you're up to.
  passages: StructurePassage[];
  currentIndex?: number;
  // The panel whose verse is showing under its row — one at a time.
  openKey: string | null;
  onToggle: (key: string) => void;
  // A verse's spot in the reader's built palace (BookStructureChapter.tsx).
  spotOf?: (verse: VerseSegment) => string | undefined;
  // Opens a verse's spot to edit — or places it on a new one — from under its panel.
  onSpot?: (verse: VerseSegment) => void;
  // The spot being edited, shown with the open verse.
  editor?: ReactNode;
}

const COLUMNS = 5;

// A verse's first word, without the punctuation around it, as the cue to say the rest.
function firstWord(text: string): string {
  const word = text.trim().split(/\s+/)[0];
  return word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "") || word;
}

// A whole chapter as one storyboard (BookStructureChapter.tsx) — dual coding, five panels to a row with
// no break between passages: a verse's picture (picked from its first sense line — lib/verseImages.ts)
// over its number with its first word beside it (shrunk to fit), the picture sage once learned, the verse you're up to ringed in
// orange, a pin if it's on a spot in your palace. A passage shows as its panels' colour, with a thick
// bar down the left of the panel it starts on. Tap a panel to check the whole verse in sense lines
// under its row (too narrow to read on the panel itself), with its passage and spot.
export function BookStructureStoryboard({ passages, currentIndex, openKey, onToggle, spotOf, onSpot, editor }: BookStructureStoryboardProps) {
  const panels = passages.flatMap((passage, position) => passage.lessons.map((stop, at) => ({ stop, passage, position, at, picture: passage.pictures[at] })));
  const rows = Array.from({ length: Math.ceil(panels.length / COLUMNS) }, (_, row) => panels.slice(row * COLUMNS, row * COLUMNS + COLUMNS));

  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row, rowAt) => {
        const openPanel = row.find((panel) => panel.stop.key === openKey);
        const openVerse = openPanel?.stop.verse;
        const spot = openVerse && spotOf?.(openVerse);
        return (
          <Fragment key={rowAt}>
            <div className="grid grid-cols-5 gap-1.5">
              {row.map(({ stop, passage, position, at, picture }) => {
                const verse = stop.verse!;
                const Icon = pictureById(picture)?.Icon;
                const open = stop.key === openKey;
                const current = passage.index === currentIndex;
                const tone = pericopeTone(pericopeNumber(verse.book, verse.chapter, passage.lessons[0].verse!.verseNumber, position), current);
                const word = firstWord(verse.text);
                return (
                  <button
                    key={stop.key}
                    type="button"
                    onClick={() => onToggle(stop.key)}
                    aria-expanded={open}
                    aria-label={`Verse ${verse.verseNumber}, ${word}${at === 0 ? `, start of ${passage.section.title}` : ""}`}
                    className={`relative flex min-h-[78px] min-w-0 flex-col items-center gap-1 rounded-[12px] border-2 px-0.5 py-1.5 ${tone.fill} ${stop.state === "current" || open ? "border-brand-500" : "border-transparent"} ${at === 0 ? `border-l-[5px] ${tone.bar}` : ""}`}
                  >
                    {spotOf?.(verse) && <MapPin size={11} strokeWidth={3} className="absolute right-1 top-1 text-brand-700 dark:text-brand-300" />}
                    <span className={`flex h-[34px] w-[34px] items-center justify-center rounded-[9px] ${stop.state === "done" ? "bg-sage-500 text-white shadow-[0_2px_0_#56633F]" : "bg-white/70 text-sand-600 dark:bg-zinc-950/60 dark:text-zinc-400"}`}>
                      {Icon && <Icon size={18} strokeWidth={2.2} />}
                    </span>
                    <span className="@container w-full">
                      <span style={{ "--chars": `${verse.verseNumber}`.length + 1 + word.length } as CSSProperties} className="block whitespace-nowrap text-center leading-tight [font-size:min(11px,calc(100cqw/(var(--chars)*0.56)))]">
                        <span className="font-extrabold text-sand-700 dark:text-zinc-400">{verse.verseNumber}</span> <span className="font-heading text-ink dark:text-zinc-100">{word}</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            {openPanel && openVerse && (
              <div className="flex flex-col gap-1 rounded-[12px] border-2 border-brand-500 bg-paper p-2.5 dark:bg-zinc-900">
                <span className="text-[10px] font-extrabold text-sand-600 dark:text-zinc-500">
                  Verse {openVerse.verseNumber} · {openPanel.passage.section.title}
                </span>
                {parseToSenseLines(openVerse.text).map((line, at) => (
                  <span key={at} className="pl-3 -indent-3 text-[14px] leading-snug text-ink dark:text-zinc-100">
                    {line}
                  </span>
                ))}
                {onSpot && (
                  <button type="button" onClick={() => onSpot(openVerse)} className="mt-1 flex min-w-0 items-center gap-1 self-start py-1 text-left text-xs font-black text-brand-700 dark:text-brand-300">
                    {spot ? <MapPin size={12} strokeWidth={3} className="shrink-0" /> : <Plus size={12} strokeWidth={3} className="shrink-0" />}
                    <span className="truncate">{spot ?? "Place it"}</span>
                  </button>
                )}
                {editor}
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
