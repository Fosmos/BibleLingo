interface MindMapReviewBadgeProps {
  // The node's last SRS review score, 0-100 (see lib/srsScopeStatus.ts).
  percent: number;
  size: "md";
}

const SIZE_CLASS = { md: "-right-2.5 -top-1.5 px-1.5 py-0.5 text-[10px]" };

// The "last review %" tag on the top-right corner of a Mind Map chapter holding SRS verses. The parent must
// be positioned and must not clip its own overflow.
export function MindMapReviewBadge({ percent, size }: MindMapReviewBadgeProps) {
  const rounded = Math.round(percent);
  // The Organic restyle: a quiet cream pill with terracotta text, whatever the score.
  return (
    <span
      aria-label={`Last review ${rounded}%`}
      className={`pointer-events-none absolute z-10 rounded-full bg-sand-100 font-sans font-extrabold leading-tight text-brand-800 shadow-organic-sm dark:bg-zinc-900 ${SIZE_CLASS[size]}`}
    >
      {rounded}%
    </span>
  );
}
