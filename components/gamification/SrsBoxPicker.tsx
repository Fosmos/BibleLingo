"use client";

import { useProgressStore } from "@/store/useProgressStore";
import { BOX_ORDER, boxDisplayNumber, boxIntervalLabel } from "@/lib/srs";
import { SrsSeal } from "@/components/ui/SrsSeal";

interface SrsBoxPickerProps {
  // Read live from the store, so the picked box shows straight away wherever this is opened.
  entityId: string;
}

// Moves a passage to any spaced-review box by hand: one button a box, its seal and how often it comes
// back. A moved passage takes up the new box's cadence from today (store/srsReviewActions.ts).
export function SrsBoxPicker({ entityId }: SrsBoxPickerProps) {
  const entity = useProgressStore((state) => state.memorizedEntities.find((candidate) => candidate.id === entityId));
  const moveEntityToBox = useProgressStore((state) => state.moveEntityToBox);
  if (!entity) return null;
  return (
    <div role="radiogroup" aria-label="Review box" className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
      {BOX_ORDER.map((box) => {
        const current = entity.srs.box === box;
        return (
          <button
            key={box}
            type="button"
            role="radio"
            aria-checked={current}
            aria-label={`Box ${boxDisplayNumber(box)}, ${boxIntervalLabel(box)}`}
            onClick={() => !current && moveEntityToBox(entity.id, box)}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border-2 px-1 ${current ? "border-brand-500 bg-brand-100 dark:bg-brand-900/40" : "border-sand-200 bg-paper dark:border-zinc-800 dark:bg-zinc-900"}`}
          >
            <SrsSeal tier={boxDisplayNumber(box)} size={20} />
            <span className="text-[11px] font-extrabold leading-tight text-ink dark:text-zinc-100">{boxIntervalLabel(box)}</span>
          </button>
        );
      })}
    </div>
  );
}
