import { Check, Lock } from "lucide-react";

interface PericopeCardRailProps {
  isLast: boolean;
  isCompleted: boolean;
  // Whether this card is currently glowing/full-strength — either it's the lesson's own home
  // section, or it's an earlier section a lesson merely spills through (see
  // PericopeCard.tsx's showsTodaysVerses) — not the same thing as the card's own lock status,
  // since a spillover-only section never gets its own "active" status.
  showsTodaysVerses: boolean;
}

// Extracted out of PericopeCard.tsx purely to keep that file under this codebase's 200-line
// cap. The rail circle straddling a card's own top-left corner (checked once done, glowing
// on every card actually showing today's verses, locked-outline otherwise) plus the thick
// dotted connector line running the full row height behind it.
export function PericopeCardRail({ isLast, isCompleted, showsTodaysVerses }: PericopeCardRailProps) {
  const circleColorClass = isCompleted
    ? "bg-brand-600 text-white"
    : showsTodaysVerses
      ? "bg-brand-500 text-white"
      : "border-2 border-line bg-white text-ink-muted dark:border-zinc-700 dark:bg-zinc-900";
  const lineColorClass = isCompleted ? "border-brand-600" : showsTodaysVerses ? "border-brand-500" : "border-line dark:border-zinc-700";

  return (
    <div className="relative flex w-14 shrink-0 flex-col items-center">
      {!isLast && <div className={`absolute inset-y-0 border-l-4 border-dotted ${lineColorClass}`} aria-hidden="true" />}
      <div
        className={`relative z-10 mt-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${circleColorClass} ${
          showsTodaysVerses ? "shadow-[0_4px_14px_rgba(162,114,77,0.4)]" : ""
        }`}
      >
        {isCompleted ? <Check size={20} /> : !showsTodaysVerses ? <Lock size={16} /> : null}
      </div>
    </div>
  );
}
