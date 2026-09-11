import type { ChapterPage } from "@/lib/chapterPagination";
import { ChapterPageContent } from "@/components/gamification/ChapterPageContent";
import { PARCHMENT_INNER_PADDING_CLASSES, resolveFillHeightPx } from "@/components/ui/ParchmentCard";
import type { RefObject } from "react";

interface ChapterFitProbesProps {
  // Native ref forwarding (React 19 — `ref` is just a regular prop now, no forwardRef needed)
  // rather than a custom-named prop: a ref threaded down through an intermediate hook's
  // return value (see lib/useChapterReadingLayout.ts) reads as a plain object property
  // wherever it's consumed, which trips this codebase's react-hooks/refs lint rule the moment
  // it sits alongside other, non-ref props on the same element — the native `ref` attribute is
  // exempt.
  ref: RefObject<HTMLDivElement | null>;
  pages: ChapterPage[];
  fillHeightPx: number | null;
  dayNumberByVerse: Map<number, number>;
  todaysVerseNumbers: Set<number>;
  completedDays: number;
  locationTags: Record<string, string>;
  iconTags: Record<string, string>;
  pegActive: boolean;
}

// Hidden — one probe per page, at the exact height the real card would render at, so
// lib/useUniformFitText.ts can find the one size that fits every page, not just one. Extracted
// out of ChapterReadingView.tsx (its original, still only, real-view caller) so a lesson/review
// screen can render this SAME set of probes against the SAME `pages` and get back the
// IDENTICAL uniform font size the reading view itself would — see lib/useChapterReadingLayout.ts,
// the shared hook both now call. A plain NORMAL-FLOW child (not `position:absolute`)
// deliberately — it's the simplest way to guarantee this gets the EXACT same width its own
// caller's real parchment card does, both being ordinary children of the same padded wrapper;
// an earlier `absolute inset-x-0` version positioned against that wrapper's own PADDING box
// instead of its CONTENT box, making the probe 32px wider than the real card and letting text
// "fit" there that measurably didn't on the real, narrower one. `invisible h-0 overflow-hidden`
// (not `hidden`/`display:none`) collapses this to zero visible height without affecting layout
// above/below it — `display:none` content has no scrollHeight to measure at all, and each own
// `[data-fit-page]` child below still gets real width/layout despite the outer collapse, since
// overflow-hidden only clips the OUTER box's own rendered size, not how its children are laid
// out inside it.
export function ChapterFitProbes({
  ref,
  pages,
  fillHeightPx,
  dayNumberByVerse,
  todaysVerseNumbers,
  completedDays,
  locationTags,
  iconTags,
  pegActive,
}: ChapterFitProbesProps) {
  const pageContentProps = { dayNumberByVerse, todaysVerseNumbers, completedDays, locationTags, iconTags, pegActive };
  return (
    <div ref={ref} aria-hidden className="invisible h-0 overflow-hidden">
      {pages.map((probePage, index) => (
        <div key={index} data-fit-page className={PARCHMENT_INNER_PADDING_CLASSES} style={{ height: `${resolveFillHeightPx(fillHeightPx)}px` }}>
          <ChapterPageContent page={probePage} {...pageContentProps} onSelect={() => {}} />
        </div>
      ))}
    </div>
  );
}
