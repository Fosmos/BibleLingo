"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { Check } from "lucide-react";
import type { TrailSection, TrailStop } from "@/lib/trailStops";
import { layoutTrail, roadPath, TRAIL_WIDTH } from "@/lib/trailLayout";
import { TrailSectionBanner } from "@/components/gamification/TrailSectionBanner";
import { TrailNode } from "@/components/gamification/TrailNode";

interface WindingTrailProps {
  sections: TrailSection[];
  label: string;
  onTapStop: (stop: TrailStop) => void;
}

const at = (x: number, y: number) => ({ "--x": `${x}px`, "--y": `${y}px` }) as CSSProperties;

// The Duolingo-style winding trail: section banners, the stops weaving between them on a road
// (solid sage up to the stop that's up next, dotted after), and a finish banner — scrolled so the
// stop that's up next sits about 200px from the top.
export function WindingTrail({ sections, label, onTapStop }: WindingTrailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { items, height } = layoutTrail(sections);
  const stops = items.filter((item) => item.kind === "stop");
  const centres = stops.map((item) => ({ x: item.x, y: item.y + item.size / 2 }));
  const reached = Math.max(0, stops.findIndex((item) => item.stop.state === "current"));
  const allDone = stops.length > 0 && stops.every((item) => item.stop.state === "done");
  const walked = allDone ? centres : centres.slice(0, reached + 1);
  const toGo = stops.filter((item) => item.stop.state !== "done").length;
  const currentY = stops.find((item) => item.stop.state === "current")?.y;

  useEffect(() => {
    if (currentY !== undefined) scrollRef.current?.scrollTo({ top: Math.max(0, currentY - 200) });
  }, [currentY, sections.length]);

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto pb-[120px] [scrollbar-width:none]">
      <div style={{ "--h": `${height}px` } as CSSProperties} className="relative mx-auto h-[var(--h)] w-[370px] max-w-full">
        <svg width={TRAIL_WIDTH} height={height} className="pointer-events-none absolute left-0 top-0 max-w-full overflow-visible" aria-hidden="true">
          <path d={roadPath(centres)} fill="none" className="stroke-sand-300 dark:stroke-zinc-700" strokeWidth={10} strokeDasharray="2 18" strokeLinecap="round" />
          {walked.length > 1 && <path d={roadPath(walked)} fill="none" className="stroke-sage-300 dark:stroke-sage-700" strokeWidth={12} strokeLinecap="round" />}
        </svg>
        {items.map((item, index) => {
          if (item.kind === "banner")
            return (
              <div key={index} style={at(16, item.y)} className="absolute left-4 right-4 top-[var(--y)] z-[2]">
                <TrailSectionBanner section={item.section} number={item.number} />
              </div>
            );
          if (item.kind === "stop")
            return (
              <div key={item.stop.key} style={at(item.x, item.y)} className="absolute left-[var(--x)] top-[var(--y)] z-[3] -translate-x-1/2">
                <TrailNode stop={item.stop} size={item.size} onTap={() => onTapStop(item.stop)} />
              </div>
            );
          return (
            <div key="finish" style={at(16, item.y)} className="absolute left-4 right-4 top-[var(--y)] z-[2] flex items-center gap-3 rounded-[26px] bg-sage-200 px-[18px] py-3.5 text-sage-900">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-[11px] font-extrabold uppercase tracking-[.06em] opacity-85">Finish</span>
                <span className="truncate font-heading text-[19px] leading-tight">{allDone ? "Path memorized" : `Memorize ${label}`}</span>
              </div>
              <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-sage-300 px-2.5 py-1 text-xs font-extrabold">{allDone ? <Check size={14} strokeWidth={3} /> : `${toGo} to go`}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
