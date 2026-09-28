interface MistakeNoticeProps {
  // The text to show, or null for none.
  text: string | null;
}

// A wrong letter's note ("Not quite — try again."), shown in a one-line slot just above the
// keyboard. The slot is always there, empty or not, so the note coming and going never changes
// the layout, and the keyboard never shrinks to make room for it (the Mind Map sheet's drill
// zone is a fixed height — see SheetDrillPortal.tsx).
export function MistakeNotice({ text }: MistakeNoticeProps) {
  return (
    <p aria-live="polite" className="flex h-5 w-full shrink-0 items-center justify-center truncate text-center text-sm font-medium text-heart-600">
      {text}
    </p>
  );
}
