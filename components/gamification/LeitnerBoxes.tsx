"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import type { MemorizedEntity } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { formatVerseSpanLabel } from "@/lib/chapterContent";
import { BOX_INTERVAL_DAYS, BOX_ORDER, boxDisplayNumber, formatNextReview } from "@/lib/srs";

const MOVE_CLASS =
  "flex h-7 w-7 items-center justify-center rounded-full border border-line text-ink-muted hover:bg-mist disabled:opacity-30 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800";

// Every memorized range laid out in its Leitner box, in cadence order (see lib/srs.ts's
// BOX_ORDER), with arrows to move a range to the box before or after — up to review it more
// often, down to review it less. A moved range takes up the new box's cadence from today (see
// store/srsReviewActions.ts's moveEntityToBox). Shared by the Memorized page's Sword of the
// Spirit card and the Mind Map's own boxes panel (MindMapLeitnerButton.tsx).
export function LeitnerBoxes() {
  const entities = useProgressStore((state) => state.memorizedEntities);
  const srsBestAccuracy = useProgressStore((state) => state.srsBestAccuracy);
  const moveEntityToBox = useProgressStore((state) => state.moveEntityToBox);

  function move(entity: MemorizedEntity, steps: number) {
    const target = BOX_ORDER[BOX_ORDER.indexOf(entity.srs.box) + steps];
    if (target) moveEntityToBox(entity.id, target);
  }

  return (
    <div className="flex flex-col gap-3">
      {BOX_ORDER.map((box, position) => {
        const boxEntities = entities.filter((entity) => entity.srs.box === box);
        const days = BOX_INTERVAL_DAYS[box];
        return (
          <div key={box} className="flex flex-col gap-2 rounded-xl bg-white p-3 dark:bg-zinc-800">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-ink dark:text-zinc-200">Box {boxDisplayNumber(box)}</p>
              <p className="text-xs text-ink-muted">
                Every {days} day{days === 1 ? "" : "s"} · {boxEntities.length}
              </p>
            </div>
            {boxEntities.length === 0 ? (
              <p className="text-xs text-ink-muted">Empty</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {boxEntities.map((entity) => {
                  const best = srsBestAccuracy[entity.id];
                  const label = formatVerseSpanLabel(entity.book, entity.chapter, entity.startVerse, entity.endVerse);
                  return (
                    <li key={entity.id} className="flex items-center gap-2">
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-serif text-sm font-semibold text-ink dark:text-zinc-100">
                          {label}
                          {best !== undefined && <span className="text-brand-500"> · {best}%</span>}
                        </span>
                        <span className="text-xs text-ink-muted">{formatNextReview(entity.srs.nextDueAt)}</span>
                      </div>
                      <button type="button" onClick={() => move(entity, -1)} disabled={position === 0} aria-label={`Move ${label} to an earlier box`} className={MOVE_CLASS}>
                        <ChevronUp size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(entity, 1)}
                        disabled={position === BOX_ORDER.length - 1}
                        aria-label={`Move ${label} to a later box`}
                        className={MOVE_CLASS}
                      >
                        <ChevronDown size={15} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
