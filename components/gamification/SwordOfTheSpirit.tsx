"use client";

import { useProgressStore } from "@/store/useProgressStore";
import { formatVerseSpanLabel } from "@/lib/chapterContent";
import { BOX_INTERVAL_DAYS, BOX_ORDER, boxDisplayNumber, formatNextReview } from "@/lib/srs";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

// The Leitner-box view of every memorized verse group's current review cadence — separate
// from SrsOverview's "what's due right now" list, this shows the whole progression across
// all boxes in promotion order (see lib/srs.ts's BOX_ORDER and scheduleReview for the
// promotion/demotion rule). The "Box N" shown here is a display-only sequential number (see
// boxDisplayNumber) rather than the internal SrsBox id, so it always reads as ascending
// review frequency even though the id for "every 3 days" (added after 1-4 already existed)
// doesn't fall between 1 and 2. Each entity also shows its best-ever review score, if it has
// one, so that's visible here without having to start a review to see it.
export function SwordOfTheSpirit() {
  const entities = useProgressStore((state) => state.memorizedEntities);
  const srsBestAccuracy = useProgressStore((state) => state.srsBestAccuracy);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
        Sword of the Spirit <InfoTip text={INFO_TIPS.swordOfTheSpirit} />
      </p>
      <div className="flex flex-col gap-3">
        {BOX_ORDER.map((box) => {
          const boxEntities = entities.filter((entity) => entity.srs.box === box);
          const days = BOX_INTERVAL_DAYS[box];
          return (
            <div key={box} className="flex flex-col gap-2 rounded-xl bg-mist p-3 dark:bg-zinc-800 sm:flex-row sm:gap-4">
              <div className="shrink-0 sm:w-28">
                <p className="text-sm font-semibold text-ink dark:text-zinc-200">Box {boxDisplayNumber(box)}</p>
                <p className="text-xs text-ink-muted">
                  Every {days} day{days === 1 ? "" : "s"}
                </p>
              </div>
              {boxEntities.length === 0 ? (
                <p className="text-xs text-ink-muted">Empty</p>
              ) : (
                <ul className="flex flex-1 flex-col gap-1">
                  {boxEntities.map((entity) => {
                    const best = srsBestAccuracy[entity.id];
                    return (
                      <li
                        key={entity.id}
                        className="flex items-center justify-between gap-3 text-xs font-medium text-ink-soft dark:text-zinc-300"
                      >
                        <span className="truncate">
                          {formatVerseSpanLabel(entity.book, entity.chapter, entity.startVerse, entity.endVerse)}
                          {best !== undefined && <span className="text-brand-500"> · {best}%</span>}
                        </span>
                        <span className="shrink-0 text-ink-muted">{formatNextReview(entity.srs.nextDueAt)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
