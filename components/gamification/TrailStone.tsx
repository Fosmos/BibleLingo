import { Trophy } from "lucide-react";
import type { TrailStop } from "@/lib/trailStops";

interface TrailStoneProps {
  stop: TrailStop;
  size: number;
  onTap: () => void;
}

const LOOK: Record<TrailStop["state"], string> = {
  done: "bg-sage-500 text-white shadow-[0_6px_0_#56633F]",
  current: "bg-brand-500 text-white shadow-[0_6px_0_#8C491A]",
  locked: "bg-sand-200 text-sand-700 shadow-[0_6px_0_#DCD3C4] dark:bg-zinc-800 dark:text-zinc-400 dark:shadow-[0_6px_0_#3f3f46]",
};

// One stepping stone (design_handoff_path_trail): a pressable "3D" circle with its verse on it — a
// trophy over it at a checkpoint — sage when done, terracotta and haloed with a bobbing START
// (RECITE) bubble when up next, grey when locked, and a terracotta dot when its verses are due.
export function TrailStone({ stop, size, onTap }: TrailStoneProps) {
  const due = stop.state === "done" && stop.dueIds.length > 0;
  return (
    <div className={`relative flex flex-col items-center ${size > 60 ? "h-[70px] w-[70px]" : "h-[58px] w-[58px]"}`}>
      {stop.state === "current" && (
        <>
          <span aria-hidden="true" className="absolute -inset-[9px] rounded-full border-[6px] border-brand-200 dark:border-brand-900/60" />
          <span className="trail-bob absolute bottom-[calc(100%+16px)] whitespace-nowrap rounded-xl border-2 border-sand-300 bg-white px-3.5 py-2 text-[13px] font-black tracking-[.08em] text-brand-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-brand-300">
            {stop.review ? "REVIEW" : stop.checkpoint && !stop.verse ? "RECITE" : "START"}
            <span aria-hidden="true" className="absolute -bottom-2 left-1/2 -ml-[7px] h-3 w-3 rotate-45 border-b-2 border-r-2 border-sand-300 bg-white dark:border-zinc-700 dark:bg-zinc-900" />
          </span>
        </>
      )}
      <button
        type="button"
        onClick={onTap}
        aria-label={`${stop.title}, ${stop.state === "current" ? "up next" : stop.state}`}
        className={`press-6 relative flex h-full w-full items-center justify-center rounded-full p-1 text-center font-black leading-[1.05] ${stop.label.length > 6 ? "text-[11px]" : "text-[13px]"} ${LOOK[stop.state]}`}
      >
        <span className="flex flex-col items-center gap-0.5">
          {stop.checkpoint && <Trophy size={18} strokeWidth={2.75} />}
          <span>{stop.label}</span>
        </span>
      </button>
      {due && <span className="absolute -right-1 -top-1 h-[18px] w-[18px] rounded-full border-[3px] border-white bg-brand-500 dark:border-zinc-950" />}
    </div>
  );
}
