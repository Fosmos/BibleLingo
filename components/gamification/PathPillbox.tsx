"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { PathKind } from "@/types";
import { PATH_TYPE_META, pathKicker } from "@/lib/pathTypeMeta";
import type { TrailSection } from "@/lib/trailStops";

interface PathPillboxProps {
  kind: PathKind;
  label: string;
  version: string;
  versesPerDay?: number;
  percent: number;
  known: number;
  total: number;
  due: number;
  sections: TrailSection[];
}

// The trail's dark pill at the top (design_handoff_path_picker → Pillbox): the path, tapping back
// to Home's "Your paths"; its three stats; and one bar segment per section, filled as it's done.
export function PathPillbox({ kind, label, version, versesPerDay, percent, known, total, due, sections }: PathPillboxProps) {
  const Icon = PATH_TYPE_META[kind].icon;
  return (
    <div className="shrink-0 px-3.5 pb-3 pt-[calc(0.5rem+env(safe-area-inset-top))]">
      <div className="flex flex-col gap-3 rounded-[34px] bg-[#FEFDFB] p-1.5 shadow-organic-md dark:bg-zinc-900">
        <Link href="/" className="flex items-center gap-3 rounded-full bg-ink py-1.5 pl-1.5 pr-4 text-paper hover:bg-ink-soft dark:bg-zinc-100 dark:text-zinc-900">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
            <Icon size={20} strokeWidth={2.75} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[10.5px] font-extrabold uppercase tracking-[.08em] text-sand-300 dark:text-zinc-500">{pathKicker(kind, version, versesPerDay)}</span>
            <span className="truncate font-heading text-[19px] leading-tight">{label}</span>
          </span>
          <span className="flex items-center gap-0.5 text-xs font-extrabold text-sand-300 dark:text-zinc-500">
            Paths <ChevronDown size={14} strokeWidth={2.75} />
          </span>
        </Link>
        <div className="grid grid-cols-3 px-3.5">
          <Stat value={`${percent}%`} label="complete" className="text-sage-800 dark:text-sage-300" />
          <Stat value={`${known}/${total}`} label={kind === "verse" ? "steps done" : "verses known"} />
          <Stat value={`${due}`} label="reviews due" className={due > 0 ? "text-brand-700 dark:text-brand-300" : ""} />
        </div>
        <div className="flex gap-1 px-3.5 pb-2.5">
          {sections.map((section, index) => (
            <span
              key={index}
              style={{ "--grow": section.stops.length, "--fill": `${section.stops.length ? (section.done / section.stops.length) * 100 : 0}%` } as CSSProperties}
              className="h-2 grow-[var(--grow)] basis-0 overflow-hidden rounded-full bg-sand-200 dark:bg-zinc-800"
            >
              <span className="block h-full w-[var(--fill)] rounded-full bg-sage-600" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label, className = "" }: { value: string; label: string; className?: string }) {
  return (
    <div className="flex flex-col">
      <span className={`font-heading text-2xl leading-none text-ink dark:text-zinc-100 ${className}`}>{value}</span>
      <span className="text-[11px] font-extrabold text-sand-700 dark:text-zinc-400">{label}</span>
    </div>
  );
}
