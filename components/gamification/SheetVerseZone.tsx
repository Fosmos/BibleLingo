"use client";

import type { CSSProperties, ReactNode } from "react";
import { useVerseFit } from "@/lib/useVerseFit";
import type { EdgeGhost } from "@/lib/verseEdgeGhost";

interface SheetVerseZoneProps {
  // The sense lines, laid out at the size the zone fits them to.
  children: (fontSizePx: number) => ReactNode;
  // "Romans 8:15" — over the verse, at its left (a Learn recall stage's reference slots while the
  // reference is being drilled — ReferenceGate.tsx).
  reference?: ReactNode;
  // The last sense line of the verse before, and the first of the verse after (left out in a
  // review — LessonPageCard.tsx), each with its verse number.
  ghostPrev?: EdgeGhost;
  ghostNext?: EdgeGhost;
  // The stage and its verses — the fit starts over when it changes.
  fitKey: string;
}

// Line height, and the gaps between verses and between sense lines (in ems of the verse's size).
const ROOMY = { leading: 1.6, verseGap: 1.1, clauseGap: 0.65 };
const COMPACT = { leading: 1.35, verseGap: 0.6, clauseGap: 0.25 };

// A lesson's verse zone (design_handoff_lesson_view): no box and no sage — the verse sits on the
// page, centred, its reference over it at the left — one size, larger than the verse — with a
// faint line of the verse before it above the reference, and of the verse after it below, each
// tagged with its verse number.
// Never scrolls: lib/useVerseFit.ts steps the type down (then goes compact) until it fits.
export function SheetVerseZone({ children, reference, ghostPrev, ghostNext, fitKey }: SheetVerseZoneProps) {
  const { ref, fontSizePx, compact } = useVerseFit(fitKey);
  const { leading, verseGap, clauseGap } = compact ? COMPACT : ROOMY;
  const spacing = {
    "--sense-leading": String(leading),
    "--sense-verse-gap": `${verseGap}em`,
    "--sense-clause-gap": `${clauseGap}em`,
    "--verse-size": `${fontSizePx}px`,
    // A verse line's gap, less the between-verses gap the verse's first line brings (SenseLineRow.tsx).
    "--reference-gap": `${fontSizePx * (clauseGap - verseGap)}px`,
  } as CSSProperties;

  return (
    <div ref={ref} className="flex h-full min-h-0 flex-col overflow-hidden px-[22px] pb-3 pt-2.5">
      <div className="min-h-0 flex-1" />
      {ghostPrev && (
        <GhostLine ghost={ghostPrev} className="mb-1.5">
          <span dir="rtl" className="min-w-0 truncate text-left">
            <bdi>…{ghostPrev.text}</bdi>
          </span>
        </GhostLine>
      )}
      <div style={spacing} className="flex flex-col">
        {/* The reference is the verse's first line: always 24px (the verse is at most 21px), in a
            verse line's height with a verse line's gap after it. */}
        {reference && (
          <div className="mb-[var(--reference-gap)] pl-1 text-left font-serif text-2xl leading-[calc(var(--verse-size)*var(--sense-leading))] text-brand-700 dark:text-brand-300">
            {reference}
          </div>
        )}
        <div className="pl-1 font-semibold tracking-[-.005em] text-ink dark:text-zinc-100">{children(fontSizePx)}</div>
      </div>
      {ghostNext && (
        <GhostLine ghost={ghostNext} className={compact ? "mt-1.5" : "mt-3"}>
          <span className="min-w-0 truncate">{ghostNext.text}…</span>
        </GhostLine>
      )}
      <div className="min-h-0 flex-1" />
    </div>
  );
}

interface GhostLineProps {
  ghost: EdgeGhost;
  className: string;
  children: ReactNode;
}

// A neighbouring verse's faint line, its verse number in a small tag before it.
function GhostLine({ ghost, className, children }: GhostLineProps) {
  return (
    <div className={`flex items-baseline gap-1.5 pl-1 text-sm font-semibold text-sand-400 dark:text-zinc-600 ${className}`}>
      <span className="shrink-0 rounded-md bg-sand-200 px-1.5 text-[11px] font-black leading-[1.5] text-sand-600 dark:bg-zinc-800 dark:text-zinc-400">{ghost.verseNumber}</span>
      {children}
    </div>
  );
}
