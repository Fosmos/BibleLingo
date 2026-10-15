"use client";

import type { CSSProperties, ReactNode } from "react";
import { useVerseFit } from "@/lib/useVerseFit";

interface SheetVerseZoneProps {
  // The sense lines, laid out at the size the zone fits them to.
  children: (fontSizePx: number) => ReactNode;
  // "Romans 8:15" — under the verse, at its right (a Learn stage's reference entry while the
  // reference is being recalled — LearnReferenceStep.tsx).
  reference?: ReactNode;
  // The last sense line of the verse before, and the first of the verse after.
  ghostPrev?: string;
  ghostNext?: string;
  // The stage and its verses — the fit starts over when it changes.
  fitKey: string;
}

// A lesson's verse zone (design_handoff_lesson_view): no box and no sage — the verse sits on the
// page, centred, its reference under it at the right, with a faint line of the verse before and
// after it.
// Never scrolls: lib/useVerseFit.ts steps the type down (then goes compact) until it fits.
export function SheetVerseZone({ children, reference, ghostPrev, ghostNext, fitKey }: SheetVerseZoneProps) {
  const { ref, fontSizePx, compact } = useVerseFit(fitKey);
  const spacing = {
    "--sense-leading": compact ? "1.35" : "1.6",
    "--sense-verse-gap": compact ? ".6em" : "1.1em",
    "--sense-clause-gap": compact ? ".25em" : ".65em",
  } as CSSProperties;

  return (
    <div ref={ref} className="flex h-full min-h-0 flex-col overflow-hidden px-[22px] pb-3 pt-2.5">
      <div className="min-h-0 flex-1" />
      {ghostPrev && !compact && (
        <span dir="rtl" className="mb-1.5 truncate pl-1 text-left text-sm font-semibold text-sand-400 dark:text-zinc-600">
          <bdi>…{ghostPrev}</bdi>
        </span>
      )}
      <div style={spacing} className="pl-1 font-semibold tracking-[-.005em] text-ink dark:text-zinc-100">
        {children(fontSizePx)}
      </div>
      {reference && <div className={`self-end text-right font-serif text-xl leading-[1.1] text-brand-700 dark:text-brand-300 ${compact ? "mt-1" : "mt-3"}`}>{reference}</div>}
      {ghostNext && !compact && <span className="mt-3 truncate pl-1 text-sm font-semibold text-sand-400 dark:text-zinc-600">{ghostNext}…</span>}
      <div className="min-h-0 flex-1" />
    </div>
  );
}
