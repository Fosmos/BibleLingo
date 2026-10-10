"use client";

import type { CSSProperties, MouseEvent } from "react";
import { bookAbbreviation, booksInRegion, type BibleRegionId } from "@/lib/bibleRegions";
import { BOOK_VERSE_COUNTS } from "@/lib/esvUsageLimits";
import type { BibleHeld } from "@/lib/useBibleHeld";
import { BibleLevelHeader } from "@/components/gamification/BibleLevelHeader";

interface BibleBookGridProps {
  region: BibleRegionId;
  held: BibleHeld;
  pathBook: string | undefined;
  onOpen: (book: string, event: MouseEvent<HTMLElement>) => void;
}

// Ring circumference for the 56px tile's 26px-radius progress ring.
const RING = 2 * Math.PI * 26;

// The Path tab's level 1 — a region's books as round tiles (your path's book filled sage, books
// you hold verses in tinted, with a ring showing how much of the book you've memorized —
// terracotta when a review is due). Tapping a book zooms into its chapters.
export function BibleBookGrid({ region, held, pathBook, onOpen }: BibleBookGridProps) {
  const books = booksInRegion(region);
  const carried = books.filter((book) => held.heldIn(book.name) > 0).length;

  return (
    <div className="h-full overflow-y-auto px-4 pb-28">
      <BibleLevelHeader title={region} sub={`${books.length} book${books.length === 1 ? "" : "s"}${carried ? ` · ${carried} with verses you carry` : ""}`} />
      <div className="grid grid-cols-4 gap-y-4">
        {books.map((book) => {
          const count = held.heldIn(book.name);
          const here = book.name === pathBook;
          const share = Math.min(1, count / (BOOK_VERSE_COUNTS[book.name] ?? Infinity));
          return (
            <button key={book.name} type="button" onClick={(event) => onOpen(book.name, event)} className="flex flex-col items-center gap-1">
              <span
                className={`relative flex h-14 w-14 items-center justify-center rounded-full font-heading text-[15px] ${
                  here
                    ? "bg-sage-600 text-white shadow-organic-md"
                    : count
                      ? "bg-sage-200 text-sage-900"
                      : "bg-sand-100 text-ink-soft shadow-organic-sm dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {count > 0 && (
                  <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90" aria-hidden="true">
                    <circle
                      cx="28"
                      cy="28"
                      r="26"
                      fill="none"
                      strokeWidth="4"
                      strokeLinecap="round"
                      style={{ "--ring": RING, "--done": RING * share } as CSSProperties}
                      className={`[stroke-dasharray:var(--done)_var(--ring)] ${held.hasDue(book.name) ? "stroke-brand-500" : "stroke-sage-500"}`}
                    />
                  </svg>
                )}
                {bookAbbreviation(book.name)}
              </span>
              <span className="line-clamp-2 text-center text-[11px] font-semibold text-ink dark:text-zinc-200">{book.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
