import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import type { TrailSection } from "@/lib/trailStops";
import { pericopeColour } from "@/lib/chapterPathPalette";

interface TrailSectionBannerProps {
  section: TrailSection;
  number: number;
}

// A section's banner across the trail (the road passes under it): its kicker and title, and how
// many of its stops are done — in the section's own colour from the reader's pericope palette
// (lib/chapterPathPalette.ts), ringed while it's the one you're on and faded until it's reached.
export function TrailSectionBanner({ section, number }: TrailSectionBannerProps) {
  const colour = pericopeColour(number - 1);
  const vars = { "--p": colour.base, "--t": colour.tint, "--k": colour.ink } as CSSProperties;
  const state = section.state === "current" ? "ring-[3px] ring-[var(--p)] shadow-organic-md" : section.state === "locked" ? "opacity-60" : "";
  return (
    <div style={vars} className={`flex items-center gap-3 rounded-[26px] bg-[var(--t)] px-[18px] py-3.5 text-[var(--k)] dark:bg-zinc-900 dark:text-zinc-100 ${state}`}>
      <span aria-hidden="true" className="h-9 w-1.5 shrink-0 rounded-full bg-[var(--p)]" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[11px] font-extrabold uppercase tracking-[.06em] text-[var(--p)]">
          Section {number} · {section.kicker}
        </span>
        <span className="truncate font-heading text-[19px] leading-tight">{section.title}</span>
      </div>
      <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-[var(--p)] px-2.5 py-1 text-xs font-extrabold text-white">
        {section.state === "complete" ? <Check size={14} strokeWidth={3} /> : `${section.done}/${section.stops.length}`}
      </span>
    </div>
  );
}
