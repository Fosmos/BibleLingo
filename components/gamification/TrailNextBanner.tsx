import type { CSSProperties } from "react";
import type { TrailSection } from "@/lib/trailStops";
import { pericopeColour } from "@/lib/chapterPathPalette";

interface TrailNextBannerProps {
  pathLabel: string;
  sections: TrailSection[];
  index: number;
  onOpenSection: (index: number) => void;
}

// The banner at the end of a section's trail (design_handoff_path_trail): the next section — "Up
// next" in its colour once this one's done, faded until then — or, after the last, the finish.
export function TrailNextBanner({ pathLabel, sections, index, onOpenSection }: TrailNextBannerProps) {
  const section = sections[index];
  const next = sections[index + 1];
  const done = section.state === "complete";
  const toGo = (list: TrailSection[]) => list.reduce((sum, item) => sum + item.stops.length - item.done, 0);
  const colour = pericopeColour(next ? index + 1 : index);
  const vars = { "--p": colour.base, "--t": colour.tint, "--k": colour.ink } as CSSProperties;
  const finished = !next && sections.every((item) => item.state === "complete");
  const lit = next ? done : finished;
  const tone = lit ? "bg-[var(--k)] text-white shadow-[0_5px_0_var(--p)]" : "bg-[var(--t)] text-[var(--k)] opacity-70 shadow-[0_5px_0_var(--t)] dark:bg-zinc-800 dark:text-zinc-200";
  const kicker = next ? `${done ? "Up next" : "Next"} · ${next.ref}` : "Finish";
  const title = next ? next.title : finished ? "Path memorized" : `Memorize ${pathLabel}`;
  const count = next ? (done ? "Go" : `${section.stops.length - section.done} to go`) : finished ? "✓" : `${toGo(sections)} to go`;
  return (
    <button type="button" style={vars} disabled={!next} onClick={() => next && onOpenSection(index + 1)} className={`press-5 flex w-full items-center gap-3 rounded-[20px] px-[18px] py-3.5 text-left ${tone}`}>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[11px] font-extrabold uppercase tracking-[.07em] opacity-85">{kicker}</span>
        <span className="font-heading text-xl leading-[1.1]">{title}</span>
      </span>
      <span className={`shrink-0 rounded-xl px-2.5 py-1.5 text-xs font-black ${lit ? "bg-white/20" : "bg-[var(--p)]/20"}`}>{count}</span>
    </button>
  );
}
