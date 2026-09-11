import { tokenizeVerseWords } from "@/lib/verseWords";
import { stumbleHeat, type StumbleHeat } from "@/lib/stumbleTracking";

interface VerseStumbleHeatMapProps {
  text: string;
  counts: number[] | undefined;
}

const HEAT_CLASS: Record<StumbleHeat, string> = {
  none: "text-ink-muted dark:text-zinc-500",
  mild: "rounded bg-amber-100 px-0.5 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
  moderate: "rounded bg-orange-200 px-0.5 font-medium text-orange-900 dark:bg-orange-900/40 dark:text-orange-200",
  severe: "rounded bg-red-300 px-0.5 font-semibold text-red-950 dark:bg-red-900/50 dark:text-red-200",
};

// Colors each word of a verse by how often it's tripped the reader up across past SRS
// reviews (see lib/stumbleTracking.ts) — against FIXED, absolute miss-count thresholds, the
// same scale for every verse in the app, not relative to that verse's own worst word. A word
// missed 3 times always reads "moderate," whether it sits in a heavily-reviewed passage or
// one reviewed only a couple of times, so the color is a real, objective signal comparable
// across every verse the reader has ever reviewed, not just a ranking within one verse.
export function VerseStumbleHeatMap({ text, counts }: VerseStumbleHeatMapProps) {
  const words = tokenizeVerseWords(text);
  const noStumbles = !counts || counts.length !== words.length;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-serif text-base leading-relaxed">
        {words.map((word, index) => (
          <span key={index} className={HEAT_CLASS[noStumbles ? "none" : stumbleHeat(counts[index])]}>
            {word}{" "}
          </span>
        ))}
      </p>
      {noStumbles && <p className="text-xs text-ink-muted">No missed words tracked here yet — review it a few more times to build the map.</p>}
    </div>
  );
}
