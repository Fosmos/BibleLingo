"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import type { TrailSection } from "@/lib/trailStops";
import { buildMapOutline, outlinePlace, type OutlineState } from "@/lib/mapOutline";

interface MapOutlineProps {
  book: string;
  sections: TrailSection[];
  // One section's stone (MapSectionStone.tsx), by its index among `sections`.
  renderStone: (index: number, position: number) => ReactNode;
}

const DOT: Record<OutlineState, string> = {
  complete: "bg-sage-500",
  current: "bg-brand-500",
  locked: "bg-sand-300 dark:bg-zinc-700",
};

// A book or chapter path's map as an outline (lib/mapOutline.ts): its themes, each a dropdown of its
// chapters, each a dropdown of its stones — pericopes, their reviews and the chapter's review — with
// the finish line after. The theme and chapter you're on start open, scrolled to the stone up next;
// the rest open and close with a tap. A book without themes lists its chapters straight away.
export function MapOutline({ book, sections, renderStone }: MapOutlineProps) {
  const outline = useMemo(() => buildMapOutline(book, sections), [book, sections]);
  const [open, setOpen] = useState<Set<string>>(() => {
    const place = outlinePlace(outline, sections);
    return new Set([place.theme, place.chapter].filter((key): key is string => key !== undefined));
  });
  const toggle = (key: string) => setOpen((keys) => (keys.has(key) ? new Set([...keys].filter((other) => other !== key)) : new Set([...keys, key])));
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    rootRef.current?.querySelector("[data-current]")?.scrollIntoView({ block: "center" });
  }, []);

  const chapterList = (theme: (typeof outline.themes)[number]) =>
    theme.chapters.map((chapter) => {
      const expanded = open.has(chapter.key);
      return (
        <div key={chapter.key} className="flex flex-col">
          <button type="button" aria-expanded={expanded} onClick={() => toggle(chapter.key)} className="flex items-center gap-2.5 rounded-[16px] px-2 py-2.5 text-left hover:bg-sand-200/60 dark:hover:bg-zinc-800">
            <ChevronRight size={18} strokeWidth={2.75} className={`shrink-0 text-sand-600 transition-transform ${expanded ? "rotate-90" : ""}`} />
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[chapter.state]}`} />
            <span className="min-w-0 flex-1 truncate font-heading text-[18px] leading-tight text-ink dark:text-zinc-100">{chapter.label}</span>
            <span className="shrink-0 text-xs font-extrabold text-sand-700 dark:text-zinc-400">
              {chapter.done}/{chapter.indices.length}
            </span>
          </button>
          {expanded && <div className="flex flex-col gap-5 pb-3 pl-3 pt-2">{chapter.indices.map((index, position) => renderStone(index, position))}</div>}
        </div>
      );
    });

  return (
    <div ref={rootRef} className="flex flex-col gap-3">
      {outline.themes.map((theme, themeIndex) => {
        if (!theme.title) return <div key={theme.key} className="flex flex-col">{chapterList(theme)}</div>;
        const expanded = open.has(theme.key);
        return (
          <section key={theme.key} className="flex flex-col rounded-[22px] border-2 border-sand-300 bg-sand-100 p-1.5 shadow-[0_4px_0_#DCD3C4] dark:border-zinc-700 dark:bg-zinc-900">
            <button type="button" aria-expanded={expanded} onClick={() => toggle(theme.key)} className="flex items-center gap-3 rounded-[18px] px-2.5 py-2.5 text-left">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-heading text-[15px] text-white ${theme.state === "complete" ? "bg-sage-500" : theme.state === "current" ? "bg-brand-500" : "bg-sand-400 dark:bg-zinc-700"}`}>{themeIndex + 1}</span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[11px] font-black uppercase tracking-[.08em] text-sand-700 dark:text-zinc-400">{theme.range}</span>
                <span className="font-heading text-[20px] leading-tight text-ink dark:text-zinc-100">{theme.title}</span>
                <span className="text-xs font-extrabold text-sand-700 dark:text-zinc-400">
                  {theme.done}/{theme.total} {theme.total === 1 ? "chapter" : "chapters"} done
                </span>
              </span>
              <ChevronRight size={20} strokeWidth={2.75} className={`shrink-0 text-sand-600 transition-transform ${expanded ? "rotate-90" : ""}`} />
            </button>
            {expanded && <div className="flex flex-col px-1 pb-1">{chapterList(theme)}</div>}
          </section>
        );
      })}
      {outline.tail.length > 0 && <div className="flex flex-col gap-5 pt-2">{outline.tail.map((index, position) => renderStone(index, position))}</div>}
    </div>
  );
}
