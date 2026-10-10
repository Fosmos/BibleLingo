"use client";

import type { CSSProperties, MouseEvent } from "react";
import { BIBLE_REGIONS, booksInRegion, type BibleRegionId } from "@/lib/bibleRegions";
import type { BibleHeld } from "@/lib/useBibleHeld";

interface BibleRegionsBoardProps {
  held: BibleHeld;
  // The active path's book, if any — its region is outlined and its dot ringed.
  pathBook: string | undefined;
  onOpen: (region: BibleRegionId, event: MouseEvent<HTMLElement>) => void;
}

// The Path tab's level 0 — the whole Bible as eight regions, each with a dot per book (ringed for
// your path's book, sage where you hold verses). Tapping a region zooms into its books.
export function BibleRegionsBoard({ held, pathBook, onOpen }: BibleRegionsBoardProps) {
  return (
    <div className="flex h-full items-start justify-center overflow-y-auto pb-28">
      <div className="relative h-[490px] w-[370px] shrink-0">
        {BIBLE_REGIONS.map((region) => {
          const books = booksInRegion(region.id);
          const heldBooks = books.filter((book) => held.heldIn(book.name) > 0);
          const here = books.some((book) => book.name === pathBook);
          const small = region.w < 100;
          const sub = here
            ? `You’re in ${pathBook}`
            : heldBooks.length
              ? `${heldBooks.length} book${heldBooks.length === 1 ? "" : "s"} · ${heldBooks.reduce((sum, book) => sum + held.heldIn(book.name), 0)} verses`
              : `${books.length} books`;
          return (
            <button
              key={region.id}
              type="button"
              onClick={(event) => onOpen(region.id, event)}
              style={{ "--x": `${region.x}px`, "--y": `${region.y}px`, "--w": `${region.w}px`, "--h": `${region.h}px` } as CSSProperties}
              className={`absolute left-[var(--x)] top-[var(--y)] flex h-[var(--h)] w-[var(--w)] flex-col gap-1.5 rounded-organic text-left text-ink transition-transform active:scale-[.98] dark:text-zinc-900 ${region.fillClass} ${small ? "p-2" : "p-3"} ${
                here ? "border-[3px] border-brand-500" : ""
              }`}
            >
              <span className={`font-heading ${small ? "text-[13px] hyphens-auto" : "text-[15px]"}`} lang="en">{region.id}</span>
              {!small && <span className={`text-xs font-semibold ${here ? "text-brand-800" : "text-ink-soft"}`}>{sub}</span>}
              {!small && (
                <span className="flex flex-wrap gap-1">
                  {books.map((book) => (
                    <i
                      key={book.name}
                      className={`h-2 w-2 rounded-full ${
                        book.name === pathBook ? "bg-brand-500 shadow-[0_0_0_3px_theme(colors.brand.200)]" : held.heldIn(book.name) ? "bg-sage-500" : "bg-ink/15"
                      }`}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
