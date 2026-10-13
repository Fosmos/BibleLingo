import { Check } from "lucide-react";
import { tileShade, type TileLevel } from "@/lib/bibleProgress";

interface ProgressCircleProps {
  level: TileLevel;
  label: string;
  // Under the circle: "14" / "5/39" / "All" / "" (not started).
  subLabel: string;
  known: number;
  complete: boolean;
  due: boolean;
  here: boolean;
  faded: boolean;
  ariaLabel: string;
  onTap: () => void;
}

// One book (Bible level) or chapter (Book level) tile: a circle shaded by verses known, a check
// badge once complete, a terracotta dot when due, and a ring on the path's current place.
export function ProgressCircle({ level, label, subLabel, known, complete, due, here, faded, ariaLabel, onTap }: ProgressCircleProps) {
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={ariaLabel}
      className={`flex w-full flex-col items-center gap-[5px] transition-[transform,opacity] duration-[120ms] active:scale-[.92] motion-reduce:transition-none ${faded ? "opacity-[.22]" : ""}`}
    >
      <span
        className={`relative flex aspect-square w-full items-center justify-center rounded-full ${level === "book" ? "max-w-[50px] text-xs font-extrabold" : "max-w-[54px] font-heading text-lg"} ${tileShade(level, known, complete)} ${
          here ? "shadow-[0_0_0_3px_#FEFDFB,0_0_0_5.5px_#201E1D] dark:shadow-[0_0_0_3px_#18181b,0_0_0_5.5px_#f4f4f5]" : ""
        }`}
      >
        {label}
        {due && <span className="absolute -right-px -top-px h-3 w-3 rounded-full border-[2.5px] border-[#FEFDFB] bg-brand-500 dark:border-zinc-900" />}
        {complete && (
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-[2.5px] border-[#FEFDFB] bg-sage-500 text-white dark:border-zinc-900">
            <Check size={11} strokeWidth={2.75} />
          </span>
        )}
      </span>
      <span className={`h-[11px] text-[10px] font-extrabold leading-[11px] ${complete ? "text-sage-900 dark:text-sage-300" : "text-sand-700 dark:text-zinc-400"}`}>{subLabel}</span>
    </button>
  );
}
