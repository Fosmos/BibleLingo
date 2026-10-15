"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowLeft, Check, Lock, Play } from "lucide-react";
import type { TrailSection } from "@/lib/trailStops";
import { pericopeColour } from "@/lib/chapterPathPalette";

interface PericopeMapScreenProps {
  pathLabel: string;
  kindLabel: string;
  sections: TrailSection[];
  onOpenSection: (index: number) => void;
}

const BUBBLE: Record<TrailSection["state"], string> = {
  complete: "bg-sage-500 text-white shadow-[0_6px_0_#56633F]",
  current: "bg-brand-500 text-white shadow-[0_6px_0_#8C491A]",
  locked: "bg-sand-200 text-sand-600 shadow-[0_6px_0_#DCD3C4] dark:bg-zinc-800 dark:text-zinc-400 dark:shadow-[0_6px_0_#3f3f46]",
};
const ZIG = ["ml-0", "ml-[34px]", "ml-[68px]", "ml-[34px]"];

// A path's sections as big bubbles (design_handoff_path_trail → PericopeMapScreen): each ringed by
// how much of it is done in its pericope colour, zig-zagging down the page, the one you're on
// with a Continue chip — tapping one opens its trail (SectionTrailScreen.tsx).
export function PericopeMapScreen({ pathLabel, kindLabel, sections, onOpenSection }: PericopeMapScreenProps) {
  const total = sections.reduce((sum, section) => sum + section.stops.length, 0);
  const done = sections.reduce((sum, section) => sum + section.done, 0);
  const percent = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex h-[100dvh] w-full flex-col -mb-28">
      <header className="flex shrink-0 items-center gap-2.5 px-3.5 pb-2.5 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <Link href="/" aria-label="Back to your paths" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-sand-600 hover:bg-sand-100 dark:text-zinc-400 dark:hover:bg-zinc-900">
          <ArrowLeft size={20} strokeWidth={2.75} />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[11px] font-black uppercase tracking-[.08em] text-sage-800 dark:text-sage-300">{kindLabel}</span>
          <span className="truncate font-heading text-[30px] leading-none text-ink dark:text-zinc-100">{pathLabel}</span>
        </div>
        <span className="rounded-xl bg-sage-200 px-[11px] py-1.5 text-[13px] font-black text-sage-900">{percent}%</span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-[22px] overflow-y-auto px-[18px] pb-[140px] pt-4 [scrollbar-width:none]">
        {sections.map((section, index) => {
          const colour = pericopeColour(index);
          const due = new Set(section.stops.flatMap((stop) => stop.dueIds)).size;
          const ring = { "--p": colour.base, "--k": colour.ink, "--fill": `${section.stops.length ? (section.done / section.stops.length) * 100 : 0}%` } as CSSProperties;
          return (
            <button key={`${section.ref}-${index}`} type="button" style={ring} onClick={() => onOpenSection(index)} className={`flex shrink-0 items-center gap-3.5 text-left ${ZIG[index % 4]}`}>
              <span className="flex h-[104px] w-[104px] shrink-0 items-center justify-center rounded-full bg-[conic-gradient(var(--p)_0_var(--fill),#DCD3C4_var(--fill)_100%)] dark:bg-[conic-gradient(var(--p)_0_var(--fill),#3f3f46_var(--fill)_100%)]">
                <span className={`press-6 -mt-1.5 flex h-[84px] w-[84px] items-center justify-center rounded-full ${BUBBLE[section.state]}`}>
                  {section.state === "complete" ? <Check size={34} strokeWidth={3.5} /> : section.state === "current" ? <Play size={30} fill="currentColor" strokeWidth={2.75} /> : <Lock size={28} strokeWidth={2.75} />}
                </span>
              </span>
              <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                <span className="max-w-full truncate text-[11px] font-black uppercase tracking-[.08em] text-[var(--p)]">{section.ref}</span>
                <span className="font-heading text-[19px] leading-[1.1] text-ink dark:text-zinc-100">{section.title}</span>
                <span className="text-xs font-extrabold text-sand-700 dark:text-zinc-400">
                  {section.done}/{section.stops.length} done{due ? ` · ${due} due` : ""}
                </span>
                {section.state === "current" && <span className="mt-1 rounded-xl bg-brand-500 px-[13px] py-[7px] text-[11.5px] font-black uppercase tracking-[.06em] text-white shadow-[0_3px_0_#8C491A]">Continue</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
