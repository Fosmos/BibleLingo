import { RANKS, rankTier } from "@/lib/ranks";

interface RankBadgeProps {
  // Which rank (lib/ranks.ts, by index).
  index: number;
  size: "sm" | "md" | "lg";
  // Not reached yet — greyed out (Profile's rank ladder).
  locked?: boolean;
}

const SIZE = {
  sm: "h-8 w-8 text-sm shadow-[0_2px_0_var(--lip)]",
  md: "h-11 w-11 text-lg shadow-[0_3px_0_var(--lip)]",
  lg: "h-20 w-20 text-[34px] shadow-[0_5px_0_var(--lip)]",
};

// Each tier of four ranks (lib/ranks.ts's rankTier) a step richer than the last: sand, pale sage,
// sage, pale terracotta, terracotta, deep umber.
const TIER_TONE = [
  "bg-sand-200 text-sand-800 [--lip:#C0B6A5]",
  "bg-sage-200 text-sage-900 [--lip:#AEBF92]",
  "bg-sage-600 text-white [--lip:#3D472B]",
  "bg-brand-300 text-brand-900 [--lip:#F6A06B]",
  "bg-brand-500 text-white [--lip:#8C491A]",
  "bg-brand-800 text-brand-200 [--lip:#402310]",
];

// A rank's emblem: its number on a chunky round badge, coloured by its tier so a higher rank always
// looks it — a milestone rank ringed — and grey while still locked.
export function RankBadge({ index, size, locked = false }: RankBadgeProps) {
  const major = RANKS[index]?.major ?? false;
  const tone = locked
    ? "border-2 border-dashed border-sand-400 bg-transparent text-sand-500 !shadow-none dark:border-zinc-600 dark:text-zinc-500"
    : `${TIER_TONE[Math.min(rankTier(index), TIER_TONE.length - 1)]} ${major ? "ring-[3px] ring-inset ring-white/45" : ""}`;
  return (
    <span aria-hidden="true" className={`flex shrink-0 items-center justify-center rounded-full font-heading leading-none ${SIZE[size]} ${tone}`}>
      {index + 1}
    </span>
  );
}
