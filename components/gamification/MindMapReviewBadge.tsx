interface MindMapReviewBadgeProps {
  // The node's last SRS review score, 0-100 (see lib/srsScopeStatus.ts).
  percent: number;
  size: "md";
}

const SIZE_CLASS = { md: "-right-2 -top-2 px-1 py-px text-[8px]" };

// The "last review %" tag on the top-right corner of a Mind Map chapter holding SRS verses —
// green once the score is solid, amber below that, so a shaky review stands out. The parent must
// be positioned and must not clip its own overflow.
export function MindMapReviewBadge({ percent, size }: MindMapReviewBadgeProps) {
  const rounded = Math.round(percent);
  const tone = rounded >= 90 ? "bg-green-600 text-white" : "bg-amber-500 text-amber-950";
  return (
    <span
      aria-label={`Last review ${rounded}%`}
      className={`pointer-events-none absolute z-10 rounded-full border border-white font-sans font-bold leading-tight shadow-sm dark:border-zinc-900 ${tone} ${SIZE_CLASS[size]}`}
    >
      {rounded}%
    </span>
  );
}
