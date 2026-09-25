import { Check } from "lucide-react";

interface MindMapMemorizedCheckProps {
  // Pixel size of the round seal — small on a 24px verse chip, a little larger on a hall card.
  size: "sm" | "md";
  // Yellow: memorized, but due its review in today's lesson (see lib/useYesterdayReview.ts).
  reviewDue?: boolean;
}

const SIZE_CLASS = { sm: "-bottom-1 -right-1 h-3 w-3", md: "-bottom-1.5 -right-1.5 h-4 w-4" };
const ICON_SIZE = { sm: 8, md: 10 };

// The "memorized" seal — a small green check tucked on the bottom-right corner of a verse chip
// (MindMapVerseStream.tsx) or a fully-memorized hall (MindMapPericopeGateway.tsx). The parent
// must be `relative`/`absolute` positioned and must not clip its own overflow.
export function MindMapMemorizedCheck({ size, reviewDue }: MindMapMemorizedCheckProps) {
  return (
    <span
      aria-label={reviewDue ? "Memorized — review before today's lesson" : "Memorized"}
      className={`pointer-events-none absolute flex items-center justify-center rounded-full border border-white text-white shadow-sm dark:border-zinc-900 ${reviewDue ? "bg-yellow-400" : "bg-green-500"} ${SIZE_CLASS[size]}`}
    >
      <Check size={ICON_SIZE[size]} strokeWidth={3.5} />
    </span>
  );
}
