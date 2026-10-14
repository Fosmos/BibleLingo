import type { TrailSection } from "@/lib/trailStops";

interface TrailSectionBannerProps {
  section: TrailSection;
  number: number;
}

const LOOK: Record<TrailSection["state"], { box: string; chip: string }> = {
  complete: { box: "bg-sage-200 text-sage-900", chip: "bg-sage-300" },
  current: { box: "bg-ink text-paper dark:bg-zinc-100 dark:text-zinc-900", chip: "bg-white/15 dark:bg-black/10" },
  locked: { box: "bg-sand-200 text-sand-800 dark:bg-zinc-800 dark:text-zinc-300", chip: "bg-sand-300 dark:bg-zinc-700" },
};

// A section's banner across the trail (the road passes under it): its kicker and title, and how
// many of its stops are done.
export function TrailSectionBanner({ section, number }: TrailSectionBannerProps) {
  const look = LOOK[section.state];
  return (
    <div className={`flex items-center gap-3 rounded-[26px] px-[18px] py-3.5 ${look.box}`}>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[11px] font-extrabold uppercase tracking-[.06em] opacity-85">
          Section {number} · {section.kicker}
        </span>
        <span className="truncate font-heading text-[19px] leading-tight">{section.title}</span>
      </div>
      <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-extrabold ${look.chip}`}>
        {section.done}/{section.stops.length}
      </span>
    </div>
  );
}
