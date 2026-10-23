"use client";

import type { CSSProperties } from "react";
import { Check, Lock, Play, RotateCcw } from "lucide-react";
import { landmarkIconById } from "@/lib/landmarkIcons";
import type { TrailSection } from "@/lib/trailStops";
import { pericopeColour } from "@/lib/chapterPathPalette";
import type { TrailTag } from "@/lib/trailTags";
import { TrailTagRow } from "@/components/gamification/TrailTagRow";

interface MapSectionStoneProps {
  section: TrailSection;
  // Its place among the path's sections — picks its pericope colour.
  index: number;
  onOpen: () => void;
  // Its symbol, a landmark id (lib/sectionEmblems.ts) — unset shows play / lock / check.
  emblem?: string;
  tags?: TrailTag[];
  className?: string;
}

const BUBBLE: Record<TrailSection["state"], string> = {
  complete: "bg-sage-500 text-white shadow-[0_6px_0_#56633F]",
  current: "bg-brand-500 text-white shadow-[0_6px_0_#8C491A]",
  locked: "bg-sand-200 text-sand-600 shadow-[0_6px_0_#DCD3C4] dark:bg-zinc-800 dark:text-zinc-400 dark:shadow-[0_6px_0_#3f3f46]",
};

// One section's stone on the Path map (PericopeMapScreen.tsx / MapOutline.tsx): a big bubble ringed
// in sage by how much of it is done, wearing its symbol with small state badges (and a loop arrow on
// a review), beside its reference in its pericope colour, its title, its progress and, up next, a
// Continue (or Review) chip — then its Memory Palace tags. `data-current` marks the one up next.
export function MapSectionStone({ section, index, onOpen, emblem, tags, className = "" }: MapSectionStoneProps) {
  const colour = pericopeColour(index);
  const Emblem = emblem ? landmarkIconById(emblem)?.Icon : undefined;
  const due = new Set(section.stops.flatMap((stop) => stop.dueIds)).size;
  const ring = { "--p": colour.base, "--fill": `${section.stops.length ? (section.done / section.stops.length) * 100 : 0}%` } as CSSProperties;
  return (
    <div style={ring} data-current={section.state === "current" || undefined} className={`flex shrink-0 flex-col gap-1.5 ${className}`}>
      <button type="button" onClick={onOpen} className="flex items-center gap-3.5 text-left">
        <span className="relative flex h-[92px] w-[92px] shrink-0 items-center justify-center rounded-full bg-[conic-gradient(#8FA073_0_var(--fill),#DCD3C4_var(--fill)_100%)] dark:bg-[conic-gradient(#8FA073_0_var(--fill),#3f3f46_var(--fill)_100%)]">
          <span className={`press-6 -mt-1.5 flex h-[74px] w-[74px] items-center justify-center rounded-full ${BUBBLE[section.state]}`}>
            {Emblem ? (
              <Emblem size={32} strokeWidth={2.25} />
            ) : section.state === "complete" ? (
              <Check size={30} strokeWidth={3.5} />
            ) : section.state === "current" ? (
              <Play size={26} fill="currentColor" strokeWidth={2.75} />
            ) : (
              <Lock size={24} strokeWidth={2.75} />
            )}
          </span>
          {/* With a symbol, the state (and a review's loop arrow) moves to small badges on the ring. */}
          {Emblem && section.state !== "current" && (
            <span className={`absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-paper dark:border-zinc-950 ${section.state === "complete" ? "bg-sage-700 text-white" : "bg-sand-300 text-sand-700 dark:bg-zinc-700 dark:text-zinc-300"}`}>
              {section.state === "complete" ? <Check size={14} strokeWidth={3.5} /> : <Lock size={12} strokeWidth={3} />}
            </span>
          )}
          {Emblem && section.review && (
            <span className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-paper bg-brand-700 text-white dark:border-zinc-950">
              <RotateCcw size={13} strokeWidth={3} />
            </span>
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <span className="max-w-full truncate text-[11px] font-black uppercase tracking-[.08em] text-[var(--p)]">{section.ref}</span>
          <span className="font-heading text-[18px] leading-[1.1] text-ink dark:text-zinc-100">{section.title}</span>
          <span className="text-xs font-extrabold text-sand-700 dark:text-zinc-400">
            {section.review ? (section.state === "complete" ? "Reviewed" : "Review the whole passage") : `${section.done}/${section.stops.length} done`}
            {due ? ` · ${due} due` : ""}
          </span>
          {section.state === "current" && (
            <span className="mt-1 rounded-xl bg-brand-500 px-[13px] py-[7px] text-[11.5px] font-black uppercase tracking-[.06em] text-white shadow-[0_3px_0_#8C491A]">{section.review ? "Review" : "Continue"}</span>
          )}
        </span>
      </button>
      {/* Beside the bubble, under the section's text — outside the button, so a tag taps on its own. */}
      {tags && <TrailTagRow tags={tags} className="ml-[106px]" />}
    </div>
  );
}
