import type { CSSProperties } from "react";
import type { MemoryState } from "@/lib/verseMemoryState";
import { STATE_FILL } from "@/lib/useVerseMemory";

interface PericopeTrailProps {
  verses: [number, MemoryState][];
  chosen: Set<number>;
  onTap: () => void;
}

const WIDTH = 306;
const HEIGHT = 44;

// A collapsed pericope card's verses as a small wave of dots in memory-state colours — tapping it
// opens the card. Long pericopes shrink their dots (dropping the numbers) so it stays one row.
export function PericopeTrail({ verses, chosen, onTap }: PericopeTrailProps) {
  const count = verses.length;
  const step = count > 1 ? Math.min(40, (WIDTH - 28) / (count - 1)) : 0;
  const size = step && step < 26 ? Math.max(14, Math.floor(step - 2)) : 24;
  const points = verses.map((_, i) => ({ x: 14 + i * step, y: 22 + Math.sin(i * 1.1) * 9 }));
  const d = points.map((point, i) => `${i ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");

  return (
    <button type="button" onClick={onTap} aria-label="Open this section's path" className="relative block h-11 w-[306px] max-w-full">
      <svg width={WIDTH} height={HEIGHT} className="absolute left-0 top-0 overflow-visible" fill="none" aria-hidden="true">
        <path d={d} stroke="var(--k)" strokeOpacity={0.3} strokeWidth={4} strokeLinecap="round" />
      </svg>
      {verses.map(([verse, state], i) => {
        const picked = state === "open" && chosen.has(verse);
        const look = picked
          ? "bg-ink text-paper dark:bg-zinc-100 dark:text-zinc-900"
          : state === "open"
            ? "border-2 border-dashed border-ink-muted bg-paper text-ink dark:bg-zinc-950 dark:text-zinc-200"
            : `${STATE_FILL[state]} ${state === "growing" ? "text-sage-900" : "text-white"}`;
        return (
          <span
            key={verse}
            style={{ "--x": `${points[i].x}px`, "--y": `${points[i].y}px`, "--d": `${size}px` } as CSSProperties}
            className={`absolute left-[var(--x)] top-[var(--y)] flex h-[var(--d)] w-[var(--d)] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[10px] font-extrabold ${look}`}
          >
            {size >= 20 ? verse : ""}
          </span>
        );
      })}
    </button>
  );
}
