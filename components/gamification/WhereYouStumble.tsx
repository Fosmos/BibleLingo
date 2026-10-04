"use client";

import { useMemo, useState } from "react";
import { useProgressStore } from "@/store/useProgressStore";
import { buildStumbleSpots } from "@/lib/stumbleSpots";
import { StumbleSpotCard } from "@/components/gamification/StumbleSpotCard";

// How many spots show before "Show all".
const COLLAPSED_COUNT = 4;

// The Memorized page's "Where you stumble" (the Organic restyle): every verse with missed words
// in past reviews (or a problem-verse flag), worst first, each with a "Drill this spot" that
// opens Relearn for it.
export function WhereYouStumble() {
  const wordStumbleCounts = useProgressStore((state) => state.wordStumbleCounts);
  const problemVerses = useProgressStore((state) => state.problemVerses);
  const entities = useProgressStore((state) => state.memorizedEntities);
  const [showAll, setShowAll] = useState(false);
  const spots = useMemo(() => buildStumbleSpots(wordStumbleCounts, problemVerses, entities), [wordStumbleCounts, problemVerses, entities]);
  const shown = showAll ? spots : spots.slice(0, COLLAPSED_COUNT);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-[22px] text-ink dark:text-zinc-100">Where you stumble</h2>
        <p className="text-sm text-ink-muted">The words you miss most, so you can drill just those.</p>
      </div>
      {spots.length === 0 ? (
        <p className="rounded-organic bg-sand-100 px-[18px] py-4 text-sm text-ink-muted dark:bg-zinc-900">
          Nothing yet — once you&apos;ve reviewed a verse, the words that trip you up show here.
        </p>
      ) : (
        <>
          {shown.map((spot) => (
            <StumbleSpotCard key={spot.key} spot={spot} />
          ))}
          {spots.length > COLLAPSED_COUNT && (
            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              className="self-start text-[13px] font-bold text-brand-700 hover:underline dark:text-brand-300"
            >
              {showAll ? "Show fewer" : `Show all ${spots.length}`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
