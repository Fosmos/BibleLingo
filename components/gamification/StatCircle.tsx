interface StatCircleProps {
  label: string;
  value: number;
  className: string;
  // Smaller, for beside the Bible progress ring (ProgressSummaryCard.tsx).
  compact?: boolean;
}

// One soft stat circle — a total over its label — shared by the Memorized page and the Path tab's
// Bible progress card.
export function StatCircle({ label, value, className, compact }: StatCircleProps) {
  return (
    <div className={`flex aspect-square min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full ${compact ? "w-full" : ""} ${className}`}>
      <span className={`font-heading leading-none ${compact ? "text-xl" : "text-[30px]"}`}>{value.toLocaleString()}</span>
      <span className={`font-bold ${compact ? "text-[10px]" : "text-xs"}`}>{label}</span>
    </div>
  );
}

// Three different families, each strong enough for white text: books terracotta, chapters sage,
// verses coffee brown.
export const STAT_CIRCLE_CLASSES = {
  books: "bg-brand-500 text-white dark:bg-brand-600",
  chapters: "bg-sage-600 text-white dark:bg-sage-700",
  verses: "bg-[#6F4E37] text-white dark:bg-[#7A5A42]",
};
