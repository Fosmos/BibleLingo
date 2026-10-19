"use client";

import type { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";
import { useVerseFit } from "@/lib/useVerseFit";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
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
  // In a verse's own row in the chapter reader (PathLessonVerseSlot.tsx): the reader's size and
  // spacing, no fitting, and no ghost lines — its neighbours are right there.
  inline?: boolean;
  // …and mid-paragraph in that reader (sense lines off): an inline span, the words flowing on.
  flow?: boolean;
}

// Line height, and the gaps between verses and between sense lines (in ems of the verse's size).
const ROOMY = { leading: 1.6, verseGap: 1.1, clauseGap: 0.65 };
const COMPACT = { leading: 1.35, verseGap: 0.6, clauseGap: 0.25 };
// In a reader row: exactly ReaderVerseRow.tsx's text — 17px lines, 1.5 apart, 12px between sense
// lines and nothing above the first — so no word moves when a lesson starts.
const IN_ROW_PX = 17;
const IN_ROW_SPACING = { "--sense-leading": "1.5", "--sense-verse-gap": "0px", "--sense-clause-gap": "12px" } as CSSProperties;

// A lesson's verse zone (design_handoff_lesson_view): no box and no sage — the verse sits on the
// page, centred, its reference over it at the left — one size, larger than the verse — with a
// faint line of the verse before it above the reference, and of the verse after it below, each
// tagged with its verse number.
// Never scrolls: lib/useVerseFit.ts steps the type down (then goes compact) until it fits.
export function SheetVerseZone({ children, reference, ghostPrev, ghostNext, fitKey, inline = false, flow = false }: SheetVerseZoneProps) {
  const { ref, fontSizePx, compact } = useVerseFit(fitKey);
  const referenceBarNode = useLessonSessionStore((state) => state.referenceBarNode);
  if (inline) {
    // The reference, while it's recalled, goes up into the lesson's top bar (PathLessonTopBar.tsx) —
    // above the verse it would push every word down.
    const referenceInBar = reference && referenceBarNode && createPortal(<span className="font-serif text-lg leading-none text-brand-700 dark:text-brand-300">{reference}</span>, referenceBarNode);
    if (flow) {
      return (
        <span className="text-ink dark:text-zinc-50">
          {referenceInBar}
          {children(IN_ROW_PX)}
        </span>
      );
    }
    return (
      <div style={IN_ROW_SPACING} className="flex flex-col font-medium text-ink dark:text-zinc-50">
        {referenceInBar}
        {children(IN_ROW_PX)}
      </div>
    );
  }
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
