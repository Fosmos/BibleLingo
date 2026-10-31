"use client";

import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { firstWord, type GridChapter, type GridTile, type VerseStrength } from "@/lib/bookGrid";
import type { TrailStop } from "@/lib/trailStops";
import { formatChapterLabel } from "@/lib/chapterContent";

interface BookGridChapterProps {
  chapter: GridChapter;
  open: boolean;
  onToggle: () => void;
  onTapStop: (stop: TrailStop) => void;
}

// One colour, pale to deep, for how well a verse is holding (lib/bookGrid.ts).
const DOT: Record<VerseStrength, string> = {
  0: "border-[1.5px] border-sand-400 dark:border-zinc-600",
  1: "bg-sage-300",
  2: "bg-sage-500",
  3: "bg-sage-700",
  4: "bg-sage-900 dark:bg-sage-200",
};

function VerseDot({ tile, onTap }: { tile: GridTile; onTap: () => void }) {
  const { verse, strength, due, next } = tile;
  const state = next ? ", up next" : due ? ", due for review" : "";
  const look = next ? "border-[3px] border-brand-500" : due ? "bg-brand-500" : DOT[strength];
  return (
    <button type="button" onClick={onTap} aria-label={`Verse ${verse.verseNumber}, ${firstWord(verse.text)}${state}`} className="flex h-7 w-6 items-center justify-center">
      <span className={`h-3.5 w-3.5 rounded-full ${look}`} />
    </button>
  );
}

// A review shows only once it can be done: a link while it's up next, a tick afterwards to redo it.
function ReviewLink({ stop, label, onTap }: { stop: TrailStop; label: string; onTap: () => void }) {
  if (stop.state === "locked") return null;
  if (stop.state === "done") {
    return (
      <button type="button" onClick={onTap} aria-label={`${label} again`} className="flex h-7 w-7 shrink-0 items-center justify-center self-start text-sage-600 dark:text-sage-400">
        <Check size={16} strokeWidth={3} />
      </button>
    );
  }
  return (
    <button type="button" onClick={onTap} className="shrink-0 self-start py-1 text-[13px] font-extrabold text-brand-700 dark:text-brand-300">
      {label}
    </button>
  );
}

// A chapter of the Path view. Closed, its name and how it stands; open, each passage's name over a
// row of dots, one per verse. Tapping a dot gives that verse.
export function BookGridChapter({ chapter, open, onToggle, onTapStop }: BookGridChapterProps) {
  const total = chapter.tiles.length;
  const status = chapter.due ? `${chapter.due} due` : chapter.known === 0 ? "" : chapter.known === total ? "Known" : `${chapter.known} of ${total}`;
  const Chevron = open ? ChevronDown : ChevronRight;
  return (
    <section data-chapter={chapter.chapter} className="flex scroll-mt-1 flex-col border-b border-sand-200 dark:border-zinc-900">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex items-center gap-2 py-3 text-left">
        <span className={`min-w-0 flex-1 truncate font-heading text-[18px] leading-tight ${chapter.hasNext ? "text-brand-700 dark:text-brand-300" : "text-ink dark:text-zinc-100"}`}>{formatChapterLabel(chapter.book, chapter.chapter)}</span>
        <span className={`shrink-0 text-[13px] font-bold ${chapter.due ? "text-brand-700 dark:text-brand-300" : "text-ink-muted"}`}>{status}</span>
        <Chevron aria-hidden="true" size={15} strokeWidth={2.5} className="shrink-0 text-sand-400" />
      </button>
      {open && (
        <div className="flex flex-col gap-3 pb-3.5">
          {chapter.passages.map((passage) => (
            <div key={passage.section.ref + passage.number} className="flex flex-col">
              <span className="text-sm font-semibold leading-snug text-ink-soft dark:text-zinc-300">{passage.section.title}</span>
              <div className="flex items-start gap-3">
                <div className="-ml-1.5 flex min-w-0 flex-1 flex-wrap">
                  {chapter.tiles
                    .filter((tile) => tile.passage === passage.number)
                    .map((tile) => (
                      <VerseDot key={tile.stop.key} tile={tile} onTap={() => onTapStop(tile.stop)} />
                    ))}
                </div>
                {passage.reviews.map((stop) => (
                  <ReviewLink key={stop.key} stop={stop} label="Review" onTap={() => onTapStop(stop)} />
                ))}
              </div>
            </div>
          ))}
          {chapter.reviews.map((stop) => (
            <ReviewLink key={stop.key} stop={stop} label="Review the whole chapter" onTap={() => onTapStop(stop)} />
          ))}
        </div>
      )}
    </section>
  );
}
