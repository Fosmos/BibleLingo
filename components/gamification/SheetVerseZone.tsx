import type { ReactNode } from "react";

interface SheetVerseZoneProps {
  children: ReactNode;
}

// The Mind Map sheet's verse zone content (LessonPageCard.tsx's portal branch, and the verse
// preview) — sense lines straight on the sheet's own parchment, no card of their own, always at
// the one fixed verse font size (lib/parchmentFontRange.ts). Never scrolls: the zone sizes
// itself to fit every sense line (see LessonBottomSheet.tsx). Its padding — pl-8 (32px) + pr-4 (16px), pt-3 (12px) + pb-2
// (8px) — must keep matching lib/pageBudget.ts's COMPACT_HORIZONTAL_PADDING_PX (48)/
// COMPACT_VERTICAL_PADDING_PX (20). The wider LEFT side is room for verse numbers, which hang
// outside the text column (see SenseLineRow.tsx).
export function SheetVerseZone({ children }: SheetVerseZoneProps) {
  return <div className="pb-2 pl-8 pr-4 pt-3">{children}</div>;
}
