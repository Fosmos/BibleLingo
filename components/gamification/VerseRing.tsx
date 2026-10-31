"use client";

import type { CSSProperties, ReactNode } from "react";
import { RING_KEY, ringColor, type RingKind } from "@/lib/verseRings";

interface VerseRingProps {
  kind: RingKind;
  age: number;
  size?: "verse" | "chapter" | "dense";
  label: string;
  onTap: () => void;
  children: ReactNode;
}

const TODAY = "#2B6CB0";
// Light enough for its black number.
const NEXT = "#6FA8DC";

// A verse's or chapter's box, filled once it's learned: green to red as its review comes due. An empty
// blue outline is for today, solid blue for what's next, and a pale outline for not learned yet. The
// button is bigger than the box, for tapping.
export function VerseRing({ kind, age, size = "verse", label, onTap, children }: VerseRingProps) {
  const color = kind === "learned" ? ringColor(age) : kind === "next" ? NEXT : TODAY;
  const look = kind === "new" ? "border-sand-300 text-ink dark:border-zinc-700 dark:text-zinc-100" : kind === "today" ? "border-[var(--ring)] text-ink dark:text-zinc-100" : "border-[var(--ring)] bg-[var(--ring)] text-ink";
  return (
    <button type="button" aria-label={label} onClick={onTap} className={`flex w-full items-center justify-center ${size === "chapter" ? "h-12" : "h-11"}`}>
      <span style={{ "--ring": color } as CSSProperties} className={`flex items-center justify-center rounded-[10px] border-[3px] font-bold ${size === "chapter" ? "h-[46px] w-[46px] text-base" : size === "dense" ? "h-10 w-10 text-sm" : "h-[38px] w-[38px] text-sm"} ${look}`}>
        {children}
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
