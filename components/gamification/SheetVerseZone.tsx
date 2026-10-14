import type { ReactNode } from "react";

interface SheetVerseZoneProps {
  children: ReactNode;
}

// The Mind Map sheet's verse zone content (LessonPageCard.tsx's portal branch, and the verse
// preview) — the sense lines in the Organic restyle's pale sage box, always at the one fixed verse
// font size (lib/parchmentFontRange.ts). Never scrolls: the zone sizes itself to fit every sense
// line (see LessonBottomSheet.tsx). Its spacing — mx-3 around the box (24px), then pl-8 (32px) +
// pr-4 (16px) inside it; mb-1 (4px) + pt-3/pb-3 (24px) vertically — must keep matching
// lib/pageBudget.ts's COMPACT_HORIZONTAL_PADDING_PX (72) / COMPACT_VERTICAL_PADDING_PX (28). The
// wider LEFT side is room for verse numbers, which hang outside the text column (see SenseLineRow.tsx).
// On the chapter path the verse's own row is the zone (`path-lesson-verse`), so the box steps aside —
// no padding of its own, so the verse's words stay where they sat in the reader.
export function SheetVerseZone({ children }: SheetVerseZoneProps) {
  return (
    <div className="mx-3 mb-1 [.path-lesson-verse_&]:m-0">
      <div className="rounded-organic bg-sage-100 pb-3 pl-8 pr-4 pt-3 text-ink dark:bg-zinc-800 dark:text-zinc-100 [.path-lesson-verse_&]:rounded-none [.path-lesson-verse_&]:bg-transparent [.path-lesson-verse_&]:p-0 [.path-lesson-verse_&]:dark:bg-transparent">{children}</div>
    </div>
  );
}
