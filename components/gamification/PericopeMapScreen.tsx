"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { motion, type PanInfo } from "framer-motion";
import { ArrowLeft, Check, Lock, Play, RotateCcw } from "lucide-react";
import { landmarkIconById } from "@/lib/landmarkIcons";
import type { TrailSection } from "@/lib/trailStops";
import { pericopeColour } from "@/lib/chapterPathPalette";
import type { MapThemePage } from "@/lib/mapThemePages";
import { MapThemePager } from "@/components/gamification/MapThemePager";
import type { TrailTag } from "@/lib/trailTags";
import { TrailTagRow } from "@/components/gamification/TrailTagRow";

interface PericopeMapScreenProps {
  pathLabel: string;
  kindLabel: string;
  sections: TrailSection[];
  onOpenSection: (index: number) => void;
  // A long book's themes, one page each (lib/mapThemePages.ts) — unset shows every section.
  pages?: MapThemePage[] | null;
  page?: number;
  onPageChange?: (page: number) => void;
  // Memory Palace tags (lib/trailTags.ts): the path's own, under the title, and each section's.
  headerTags?: TrailTag[];
  tagsFor?: (section: TrailSection) => TrailTag[];
  // Each section's symbol, a landmark id (lib/sectionEmblems.ts) — unset shows play / lock / check.
  emblemFor?: (section: TrailSection) => string;
}

// How far a swipe across the sections must travel to turn the theme page.
const SWIPE_PX = 70;

const BUBBLE: Record<TrailSection["state"], string> = {
  complete: "bg-sage-500 text-white shadow-[0_6px_0_#56633F]",
  current: "bg-brand-500 text-white shadow-[0_6px_0_#8C491A]",
  locked:
    "bg-sand-200 text-sand-600 shadow-[0_6px_0_#DCD3C4] dark:bg-zinc-800 dark:text-zinc-400 dark:shadow-[0_6px_0_#3f3f46]",
};
const ZIG = ["ml-0", "ml-[34px]", "ml-[68px]", "ml-[34px]"];

// A path's sections as big bubbles (design_handoff_path_trail → PericopeMapScreen): each ringed in
// sage by how much of it is done (one colour for done everywhere), its reference in its pericope
// colour, zig-zagging down the page, the one you're on with a Continue chip — tapping one opens
// its trail (SectionTrailScreen.tsx). A long book's sections sit on a page per theme, turned with
// the pager's arrows or dots or a swipe.
export function PericopeMapScreen({
  pathLabel,
  kindLabel,
  sections,
  onOpenSection,
  pages,
  page = 0,
  onPageChange,
  headerTags = [],
  tagsFor,
  emblemFor,
}: PericopeMapScreenProps) {
  const shownPage = pages?.[page];
  const shown = shownPage
    ? shownPage.indices
    : sections.map((_, index) => index);
  const turn = (next: number) =>
    pages && next >= 0 && next < pages.length && onPageChange?.(next);
  const onSwipe = (_: unknown, info: PanInfo) => {
    if (
      Math.abs(info.offset.x) > SWIPE_PX &&
      Math.abs(info.offset.x) > Math.abs(info.offset.y)
    )
      turn(page + (info.offset.x < 0 ? 1 : -1));
  };
  const total = sections.reduce(
    (sum, section) => sum + section.stops.length,
    0,
  );
  const done = sections.reduce((sum, section) => sum + section.done, 0);
  const percent = total ? Math.round((done / total) * 100) : 0;
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
      {pages && shownPage && onPageChange && (
        <MapThemePager pages={pages} page={page} onPageChange={onPageChange} />
      )}
      <motion.div
        key={page}
        initial={pages ? { opacity: 0, x: 24 } : false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        drag={pages ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.25}
        dragDirectionLock
        onDragEnd={onSwipe}
        className="flex min-h-0 flex-1 touch-pan-y flex-col gap-[22px] overflow-y-auto px-[18px] pb-[140px] pt-4 [scrollbar-width:none]"
      >
        {shown.map((index, position) => {
          const section = sections[index];
          const colour = pericopeColour(index);
          const Emblem = emblemFor ? landmarkIconById(emblemFor(section))?.Icon : undefined;
          const due = new Set(section.stops.flatMap((stop) => stop.dueIds))
            .size;
          const ring = {
            "--p": colour.base,
            "--fill": `${section.stops.length ? (section.done / section.stops.length) * 100 : 0}%`,
          } as CSSProperties;
          return (
            <div
              key={`${section.ref}-${index}`}
              style={ring}
              className={`flex shrink-0 flex-col gap-1.5 ${ZIG[position % 4]}`}
            >
              <button
                type="button"
                onClick={() => onOpenSection(index)}
                className="flex items-center gap-3.5 text-left"
              >
                <span className="relative flex h-[104px] w-[104px] shrink-0 items-center justify-center rounded-full bg-[conic-gradient(#8FA073_0_var(--fill),#DCD3C4_var(--fill)_100%)] dark:bg-[conic-gradient(#8FA073_0_var(--fill),#3f3f46_var(--fill)_100%)]">
                  <span
                    className={`press-6 -mt-1.5 flex h-[84px] w-[84px] items-center justify-center rounded-full ${BUBBLE[section.state]}`}
                  >
                    {Emblem ? (
                      <Emblem size={36} strokeWidth={2.25} />
                    ) : section.state === "complete" ? (
                      <Check size={34} strokeWidth={3.5} />
                    ) : section.state === "current" ? (
                      <Play size={30} fill="currentColor" strokeWidth={2.75} />
                    ) : (
                      <Lock size={28} strokeWidth={2.75} />
                    )}
                  </span>
                  {/* With a symbol, the state (and a review's loop arrow) moves to small badges on the ring. */}
                  {Emblem && section.state !== "current" && (
                    <span className={`absolute bottom-0.5 right-0.5 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-paper dark:border-zinc-950 ${section.state === "complete" ? "bg-sage-700 text-white" : "bg-sand-300 text-sand-700 dark:bg-zinc-700 dark:text-zinc-300"}`}>
                      {section.state === "complete" ? <Check size={14} strokeWidth={3.5} /> : <Lock size={12} strokeWidth={3} />}
                    </span>
                  )}
                  {Emblem && section.review && (
                    <span className="absolute left-0.5 top-0.5 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-paper bg-brand-700 text-white dark:border-zinc-950">
                      <RotateCcw size={13} strokeWidth={3} />
                    </span>
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                  <span className="max-w-full truncate text-[11px] font-black uppercase tracking-[.08em] text-[var(--p)]">
                    {section.ref}
                  </span>
                  <span className="font-heading text-[19px] leading-[1.1] text-ink dark:text-zinc-100">
                    {section.title}
                  </span>
                  <span className="text-xs font-extrabold text-sand-700 dark:text-zinc-400">
                    {section.review ? (section.state === "complete" ? "Reviewed" : "Review the whole passage") : `${section.done}/${section.stops.length} done`}
                    {due ? ` · ${due} due` : ""}
                  </span>
                  {section.state === "current" && (
                    <span className="mt-1 rounded-xl bg-brand-500 px-[13px] py-[7px] text-[11.5px] font-black uppercase tracking-[.06em] text-white shadow-[0_3px_0_#8C491A]">
                      {section.review ? "Review" : "Continue"}
                    </span>
                  )}
                </span>
              </button>
              {/* Beside the bubble, under the section's text — outside the button, so a tag taps on its own. */}
              {tagsFor && (
                <TrailTagRow tags={tagsFor(section)} className="ml-[118px]" />
              )}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
