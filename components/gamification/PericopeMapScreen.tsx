"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { TrailSection } from "@/lib/trailStops";
import type { TrailTag } from "@/lib/trailTags";
import { TrailTagRow } from "@/components/gamification/TrailTagRow";
import { MapSectionStone } from "@/components/gamification/MapSectionStone";
import { MapOutline } from "@/components/gamification/MapOutline";

interface PericopeMapScreenProps {
  pathLabel: string;
  kindLabel: string;
  sections: TrailSection[];
  onOpenSection: (index: number) => void;
  // A book or chapter path's book — its map is an outline of themes and chapters (MapOutline.tsx).
  // Unset (topic and verse paths) lists the sections' stones straight down.
  outlineBook?: string;
  // Memory Palace tags (lib/trailTags.ts): the path's own, under the title, and each section's.
  headerTags?: TrailTag[];
  tagsFor?: (section: TrailSection) => TrailTag[];
  // Each section's symbol, a landmark id (lib/sectionEmblems.ts) — unset shows play / lock / check.
  emblemFor?: (section: TrailSection) => string;
}

const ZIG = ["ml-0", "ml-[28px]", "ml-[56px]", "ml-[28px]"];

// A path's sections as stones (design_handoff_path_trail → PericopeMapScreen, MapSectionStone.tsx):
// a book or chapter path's in an outline — its themes, opening to chapters, opening to the stones
// (MapOutline.tsx), the place you're on open — any other path's zig-zagging straight down the page.
// Tapping a stone opens it (PathTrailScreen.tsx).
export function PericopeMapScreen({ pathLabel, kindLabel, sections, onOpenSection, outlineBook, headerTags = [], tagsFor, emblemFor }: PericopeMapScreenProps) {
  const total = sections.reduce((sum, section) => sum + section.stops.length, 0);
  const done = sections.reduce((sum, section) => sum + section.done, 0);
  const percent = total ? Math.round((done / total) * 100) : 0;
  const stone = (index: number, position: number) => (
    <MapSectionStone
      key={`${sections[index].ref}-${index}`}
      section={sections[index]}
      index={index}
      onOpen={() => onOpenSection(index)}
      emblem={emblemFor?.(sections[index])}
      tags={tagsFor?.(sections[index])}
      className={ZIG[position % 4]}
    />
  );

  return (
    <div className="flex h-[100dvh] w-full flex-col -mb-28">
      <header className="flex shrink-0 items-center gap-2.5 px-3.5 pb-2.5 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <Link
          href="/"
          aria-label="Back to your paths"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-sand-600 hover:bg-sand-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          <ArrowLeft size={20} strokeWidth={2.75} />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[11px] font-black uppercase tracking-[.08em] text-sage-800 dark:text-sage-300">
            {kindLabel}
          </span>
          <span className="truncate font-heading text-[30px] leading-none text-ink dark:text-zinc-100">
            {pathLabel}
          </span>
          <TrailTagRow tags={headerTags} className="mt-1" />
        </div>
        <span className="rounded-xl bg-sage-200 px-[11px] py-1.5 text-[13px] font-black text-sage-900">
          {percent}%
        </span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-[22px] overflow-y-auto px-[18px] pb-[140px] pt-4 [scrollbar-width:none]">
        {outlineBook ? <MapOutline book={outlineBook} sections={sections} renderStone={stone} /> : sections.map((_, index) => stone(index, index))}
      </div>
    </div>
  );
}
