import { Check, Lock, Play, Trophy } from "lucide-react";
import type { TrailStop } from "@/lib/trailStops";

interface TrailNodeProps {
  stop: TrailStop;
  size: number;
  onTap: () => void;
}

const LOOK: Record<TrailStop["state"], { circle: string; label: string }> = {
  done: { circle: "bg-sage-500 text-white shadow-[0_6px_0_#56633F]", label: "text-sage-800 dark:text-sage-300" },
  current: { circle: "bg-brand-500 text-white shadow-[0_6px_0_#8C491A]", label: "text-brand-800 dark:text-brand-300" },
  locked: { circle: "bg-sand-200 text-sand-500 shadow-[0_6px_0_#DCD3C4] dark:bg-zinc-800 dark:text-zinc-500 dark:shadow-[0_6px_0_#3f3f46]", label: "text-sand-600 dark:text-zinc-500" },
};

// One stop on the trail: a pressable "3D" circle — done (check, or a trophy at a checkpoint), up
// next (play, with a halo and a START / RECITE bubble), or locked — with its label under it, and
// a terracotta dot when a done stop's verses are due for review.
export function TrailNode({ stop, size, onTap }: TrailNodeProps) {
  const look = LOOK[stop.state];
  const icon = stop.state === "done" ? (stop.checkpoint ? <Trophy size={size * 0.4} strokeWidth={2.75} /> : <Check size={size * 0.42} strokeWidth={3} />) : stop.state === "current" ? <Play size={size * 0.38} strokeWidth={2.75} fill="currentColor" /> : stop.checkpoint ? <Trophy size={size * 0.38} strokeWidth={2.75} /> : <Lock size={size * 0.34} strokeWidth={2.75} />;
  return (
    <div className="flex flex-col items-center gap-3.5">
      <div className="relative">
        {stop.state === "current" && (
          <>
            <span aria-hidden="true" className="absolute -inset-[9px] rounded-full bg-brand-200 dark:bg-brand-900/60" />
            <span className="absolute -top-11 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-[13px] py-1.5 text-xs font-extrabold tracking-[.05em] text-paper dark:bg-zinc-100 dark:text-zinc-900">
              {stop.checkpoint ? "RECITE" : "START"}
            </span>
          </>
        )}
        <button
          type="button"
          onClick={onTap}
          aria-label={`${stop.title}, ${stop.state === "current" ? "up next" : stop.state}`}
          className={`relative flex items-center justify-center rounded-full transition-transform active:translate-y-1 ${size > 75 ? "h-[84px] w-[84px]" : "h-[70px] w-[70px]"} ${look.circle}`}
        >
          {icon}
          {stop.dueIds.length > 0 && <span className="absolute right-0 top-0 h-5 w-5 rounded-full border-[3px] border-paper bg-brand-500 dark:border-zinc-950" />}
        </button>
      </div>
      <span className={`max-w-[120px] truncate text-xs font-extrabold ${look.label}`}>{stop.label}</span>
    </div>
  );
}
