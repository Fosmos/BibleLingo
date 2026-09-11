import { Check, Lock } from "lucide-react";

interface PericopeCardRailProps {
  isLast: boolean;
  isCompleted: boolean;
  // Whether this card is currently glowing/full-strength — either it's the lesson's own home
  // section, an active capstone day (Full Review, Boss Battle, ...), or an earlier section a
  // lesson merely spills through (see PericopeCard.tsx's isEmphasized) — not the same thing
  // as the card's own lock status, since a spillover-only section never gets its own "active"
  // status yet still counts here. Also shrinks the circle/line for every other (compact) row,
  // so the rail reads as a quiet thread connecting a short list rather than its own row of
  // heavy, same-sized badges.
  isEmphasized: boolean;
}

// Extracted out of PericopeCard.tsx purely to keep that file under this codebase's 200-line
// cap. The rail circle straddling a card's own top-left corner (checked once done, glowing
// on the one emphasized card, small and locked-outline otherwise) plus a dotted connector
// line running the full row height behind it.
export function PericopeCardRail({ isLast, isCompleted, isEmphasized }: PericopeCardRailProps) {
  const circleColorClass = isCompleted
    ? "bg-brand-600 text-white"
    : isEmphasized
      ? "bg-brand-500 text-white"
      : "border-2 border-line bg-white text-ink-muted dark:border-zinc-700 dark:bg-zinc-900";
  const lineColorClass = isCompleted ? "border-brand-600/60" : isEmphasized ? "border-brand-500" : "border-line dark:border-zinc-700";
  const circleSizeClass = isEmphasized ? "mt-4 h-12 w-12" : "mt-3.5 h-8 w-8";

  return (
    <div className="relative flex w-14 shrink-0 flex-col items-center">
      {!isLast && (
        <div className={`absolute inset-y-0 border-l-2 border-dotted ${lineColorClass} ${isEmphasized ? "border-l-4" : ""}`} aria-hidden="true" />
      )}
      <div
        className={`relative z-10 flex shrink-0 items-center justify-center rounded-full ${circleSizeClass} ${circleColorClass} ${
          isEmphasized ? "shadow-[0_4px_14px_rgba(107,86,68,0.35)]" : ""
        }`}
      >
        {isCompleted ? <Check size={isEmphasized ? 20 : 14} /> : !isEmphasized ? <Lock size={12} /> : null}
      </div>
    </div>
  );
}
