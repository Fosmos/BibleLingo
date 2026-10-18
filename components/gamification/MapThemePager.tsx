"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MapThemePage } from "@/lib/mapThemePages";

interface MapThemePagerProps {
  pages: MapThemePage[];
  page: number;
  onPageChange: (page: number) => void;
}

const ARROW =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border-2 border-sand-300 bg-white text-ink shadow-[0_3px_0_#DCD3C4] transition-transform active:translate-y-0.5 active:shadow-none disabled:opacity-30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-none";

// The book map's theme pages (lib/mapThemePages.ts): the theme shown, its chapters, arrows to the
// themes either side, and a dot per theme — the one shown filled.
export function MapThemePager({ pages, page, onPageChange }: MapThemePagerProps) {
  const shown = pages[page];
  return (
    <div className="flex shrink-0 flex-col items-center gap-2 px-3.5 pb-1">
      <div className="flex w-full items-center gap-2.5">
        <button type="button" aria-label="Previous theme" disabled={page === 0} onClick={() => onPageChange(page - 1)} className={ARROW}>
          <ChevronLeft size={20} strokeWidth={2.75} />
        </button>
        <div className="flex min-w-0 flex-1 flex-col items-center text-center" aria-live="polite">
          <span className="text-[11px] font-black uppercase tracking-[.08em] text-sand-700 dark:text-zinc-400">
            Theme {page + 1} of {pages.length} · {shown.range}
          </span>
          <span className="max-w-full truncate font-heading text-[21px] leading-tight text-ink dark:text-zinc-100">{shown.title}</span>
        </div>
        <button type="button" aria-label="Next theme" disabled={page === pages.length - 1} onClick={() => onPageChange(page + 1)} className={ARROW}>
          <ChevronRight size={20} strokeWidth={2.75} />
        </button>
      </div>
      <div className="flex gap-1.5" role="tablist" aria-label="Themes">
        {pages.map((entry, index) => (
          <button
            key={entry.title}
            type="button"
            role="tab"
            aria-selected={index === page}
            aria-label={entry.title}
            onClick={() => onPageChange(index)}
            className={`h-2 rounded-full transition-all ${index === page ? "w-5 bg-brand-500" : "w-2 bg-sand-300 dark:bg-zinc-700"}`}
          />
        ))}
      </div>
    </div>
  );
}
