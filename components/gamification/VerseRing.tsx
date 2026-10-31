"use client";

import type { CSSProperties, ReactNode } from "react";
import { SrsSeal } from "@/components/ui/SrsSeal";
import { RING_KEY, ringColor, type RingKind } from "@/lib/verseRings";

interface VerseRingProps {
  kind: RingKind;
  age: number;
  size?: "verse" | "chapter" | "dense";
  // Its spaced-review box as a seal on its corner (lib/srsSeals.ts).
  seal?: number | null;
  // How much of a chapter is memorized, 0 to 1: the box fills that far from the bottom, in green.
  fill?: number;
  // A chapter with a verse due for review: an orange dot on its corner.
  due?: boolean;
  label: string;
  onTap: () => void;
  children: ReactNode;
}

const TODAY = "#4F8A3C";
// Light enough for its black number.
const NEXT = "#6FA8DC";
const FILL = ringColor(0);

// A verse's or chapter's box, filled once it's learned: green to red as its review comes due. An empty
// green outline is for today, solid blue for what's next, and a pale outline for not learned yet. The
// button is bigger than the box, for tapping. A chapter fills green as far as it's memorized, with an orange dot when a verse in it is due.
export function VerseRing({ kind, age, size = "verse", seal = null, fill, due = false, label, onTap, children }: VerseRingProps) {
  const color = fill !== undefined && kind !== "today" ? FILL : kind === "learned" ? ringColor(age) : kind === "next" ? NEXT : TODAY;
  const filled = fill !== undefined && fill > 0;
  const look = filled ? "border-[var(--ring)] bg-[#FEFDFB] text-ink" : kind === "new" ? "border-sand-300 text-ink dark:border-zinc-700 dark:text-zinc-100" : kind === "today" ? "border-[var(--ring)] text-ink dark:text-zinc-100" : "border-[var(--ring)] bg-[var(--ring)] text-ink";
  return (
    <button type="button" aria-label={label} onClick={onTap} className={`flex w-full items-center justify-center ${size === "chapter" ? "h-12" : "h-11"}`}>
      <span style={{ "--ring": color, "--fill": `${(fill ?? 0) * 100}%`, "--fill-color": FILL } as CSSProperties} className={`relative flex items-center justify-center rounded-[10px] border-[3px] font-bold ${size === "chapter" ? "h-[46px] w-[46px] text-base" : size === "dense" ? "h-10 w-10 text-sm" : "h-[38px] w-[38px] text-sm"} ${look}`}>
        {filled && (
          <span aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-[7px]">
            <span className="absolute inset-x-0 bottom-0 h-[var(--fill)] bg-[var(--fill-color)]" />
          </span>
        )}
        <span className="relative">{children}</span>
        {due && <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#E0701F]" />}
        {seal !== null && (
          <span className="absolute -bottom-1.5 -right-1.5">
            <SrsSeal tier={seal} size={18} />
          </span>
        )}
      </span>
    </button>
  );
}

// What the box colours mean.
export function RingKey({ showToday = true }: { showToday?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-2 text-xs font-bold text-sand-700 dark:text-zinc-400">
      <span>Reviewed</span>
      {RING_KEY.map((color) => (
        <span key={color} style={{ "--ring": color } as CSSProperties} className="h-4 w-4 rounded-[4px] bg-[var(--ring)]" />
      ))}
      <span>Due</span>
      {showToday && (
        <>
          <span style={{ "--ring": TODAY } as CSSProperties} className="ml-2 h-4 w-4 rounded-[4px] border-[3px] border-[var(--ring)]" />
          <span>Today</span>
        </>
      )}
    </div>
  );
}
