import type { CSSProperties } from "react";

interface SrsAccuracyTrackerProps {
  // The review's score so far, 0–100: words right first try out of the whole passage (it only
  // falls as mistakes happen), and the score needed to move up a box.
  accuracy: number;
  threshold: number;
}

// A spaced review's live score in the lesson header: a bar that fills to the score — sage while
// it's still enough to move the passage up a box, yellow just under (within 10 points), red
// below that — with a marker at the threshold.
export function SrsAccuracyTracker({ accuracy, threshold }: SrsAccuracyTrackerProps) {
  const tone = accuracy >= threshold ? "pass" : accuracy >= threshold - 10 ? "close" : "low";
  const bar = { pass: "bg-sage-600", close: "bg-[#D9A520]", low: "bg-red-500" }[tone];
  const text = { pass: "text-sage-700 dark:text-sage-300", close: "text-[#A87B0C] dark:text-[#E8C04A]", low: "text-red-600 dark:text-red-400" }[tone];
  const vars = { "--score": `${accuracy}%`, "--mark": `${threshold}%` } as CSSProperties;
  return (
    <div className="flex items-center gap-2.5" role="meter" aria-valuenow={accuracy} aria-valuemin={0} aria-valuemax={100} aria-label={`Review score ${accuracy}%, ${threshold}% moves it up a box`}>
      <div style={vars} className="relative h-2.5 flex-1 rounded-full bg-sand-200 dark:bg-zinc-800">
        <div className={`h-full w-[var(--score)] rounded-full transition-[width,background-color] duration-300 ${bar}`} />
        <span aria-hidden="true" className="absolute -top-1 bottom-[-4px] left-[var(--mark)] w-[3px] -translate-x-1/2 rounded-full bg-ink dark:bg-zinc-100" />
      </div>
      <span className={`w-11 text-right font-heading text-base leading-none ${text}`}>{accuracy}%</span>
      <span className="whitespace-nowrap text-[11px] font-extrabold text-sand-700 dark:text-zinc-400">{threshold}% to move up</span>
    </div>
  );
}
