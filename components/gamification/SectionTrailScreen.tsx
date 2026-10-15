"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { ArrowLeft } from "lucide-react";
import type { TrailSection, TrailStop } from "@/lib/trailStops";
import { layoutSectionTrail, roadPath, TRAIL_WIDTH } from "@/lib/trailLayout";
import { pericopeColour } from "@/lib/chapterPathPalette";
import { TrailStone } from "@/components/gamification/TrailStone";
import { TrailNextBanner } from "@/components/gamification/TrailNextBanner";

interface SectionTrailScreenProps {
  pathLabel: string;
  sections: TrailSection[];
  index: number;
  onBack: () => void;
  onTapStop: (stop: TrailStop) => void;
  onOpenSection: (index: number) => void;
}

const at = (x: number, y: number) => ({ "--x": `${x}px`, "--y": `${y}px` }) as CSSProperties;

// One section's stepping stones (design_handoff_path_trail → SectionTrailScreen): a header in the
// section's pericope colour with just its reference and title, the stones on a winding road (solid
// sage up to the stop that's up next, dotted after), and the next section — or the finish — below,
// scrolled so the stop that's up next sits about 200px down.
export function SectionTrailScreen({ pathLabel, sections, index, onBack, onTapStop, onOpenSection }: SectionTrailScreenProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const section = sections[index];
  const { stones, bannerTop, height } = layoutSectionTrail(section);
  const centres = stones.map((stone) => ({ x: stone.x, y: stone.y + stone.size / 2 }));
  const reached = stones.findIndex((stone) => stone.stop.state === "current");
  const walked = centres.slice(0, reached < 0 ? (section.state === "complete" ? centres.length : 0) : reached + 1);
  const currentY = stones.find((stone) => stone.stop.state === "current")?.y;
  const colour = pericopeColour(index);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = currentY === undefined ? 0 : Math.max(0, currentY - 200);
  }, [index, currentY]);

  return (
    <div className="flex h-[100dvh] w-full flex-col -mb-28">
      <div className="shrink-0 px-3.5 pb-3.5 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <div style={{ "--k": colour.ink, "--p": colour.base } as CSSProperties} className="flex items-center gap-3 rounded-[20px] bg-[var(--k)] py-2 pl-2 pr-4 text-white shadow-[0_5px_0_var(--p)]">
          <button type="button" onClick={onBack} aria-label="Back to the map" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white/15 hover:bg-white/25">
            <ArrowLeft size={20} strokeWidth={2.75} />
          </button>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-xs font-black uppercase tracking-[.06em] text-white/80">{section.ref}</span>
            <span className="font-heading text-[21px] leading-[1.05]">{section.title}</span>
          </div>
        </div>
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto pb-[120px] [scrollbar-width:none]">
        <div style={{ "--h": `${height}px` } as CSSProperties} className="relative mx-auto h-[var(--h)] w-[370px] max-w-full">
          <svg width={TRAIL_WIDTH} height={height} className="pointer-events-none absolute left-0 top-0 max-w-full overflow-visible" aria-hidden="true">
            <path d={roadPath(centres)} fill="none" className="stroke-sand-300 dark:stroke-zinc-700" strokeWidth={8} strokeDasharray="2 14" strokeLinecap="round" />
            {walked.length > 1 && <path d={roadPath(walked)} fill="none" className="stroke-sage-300 dark:stroke-sage-700" strokeWidth={10} strokeLinecap="round" />}
          </svg>
          {stones.map((stone) => (
            <div key={stone.stop.key} style={at(stone.x, stone.y)} className="absolute left-[var(--x)] top-[var(--y)] z-[3] -translate-x-1/2">
              <TrailStone stop={stone.stop} size={stone.size} onTap={() => onTapStop(stone.stop)} />
            </div>
          ))}
          <div style={at(16, bannerTop)} className="absolute left-4 right-4 top-[var(--y)] z-[2]">
            <TrailNextBanner pathLabel={pathLabel} sections={sections} index={index} onOpenSection={onOpenSection} />
          </div>
        </div>
      </div>
    </div>
  );
}
