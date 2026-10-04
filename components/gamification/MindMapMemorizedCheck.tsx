import { Check } from "lucide-react";

interface MindMapMemorizedCheckProps {
  // Pixel size of the round seal — small on a 24px verse chip, a little larger on a hall card.
  size: "sm" | "md";
  // Terracotta: memorized, but due its review in today's lesson (see lib/useYesterdayReview.ts).
  reviewDue?: boolean;
}

const SIZE_CLASS = { sm: "-right-1.5 -top-1.5 h-4 w-4", md: "-right-2 -top-2 h-[22px] w-[22px]" };
const ICON_SIZE = { sm: 9, md: 12 };

// The "memorized" seal — a small sage check on the top-right corner of a verse chip
// (MindMapVerseStream.tsx) or a fully-memorized hall (MindMapPericopeGateway.tsx). The parent
// must be `relative`/`absolute` positioned and must not clip its own overflow.
export function MindMapMemorizedCheck({ size, reviewDue }: MindMapMemorizedCheckProps) {
  return (
    <span
      aria-label={reviewDue ? "Memorized — review before today's lesson" : "Memorized"}
      className={`pointer-events-none absolute flex items-center justify-center rounded-full border-2 border-[#F5EAD8] text-white dark:border-zinc-950 ${reviewDue ? "bg-brand-500" : "bg-sage-600"} ${SIZE_CLASS[size]}`}
    >
      <Check size={ICON_SIZE[size]} strokeWidth={3.5} />
    </span>
  );
}
