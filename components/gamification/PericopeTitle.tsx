import { getPericopeForVerse } from "@/lib/chapterPericopes";

interface PericopeTitleProps {
  book: string | undefined;
  chapter: number | undefined;
  verseNumber: number | undefined;
  heading: string | undefined;
}

// A page's own pericope title — rendered OUTSIDE the parchment card (never inside it, so it
// can never disturb the card's own auto-sized shape or its top-left anchor), and shown for
// EVERY page that pericope's verses span, not just the one page that happens to open it — so
// flipping through a multi-page pericope keeps naming which section you're still in instead of
// the title vanishing after its own first page. Carries its own real verse span in brackets
// (e.g. "(1:3-8)") — looked up fresh via getPericopeForVerse rather than read off the page's
// own segment, since pagination narrows a segment's startVerse/endVerse down to just THIS
// page's slice (see lib/chapterPagination.ts's own flush()), while the bracket is meant to
// show the whole pericope's real range regardless of which page of it happens to be open.
//
// Shared by ChapterReadingView.tsx (the Path screen's own browsing view) AND
// LessonPageCard.tsx (every Learn/SRS drill stage) — the ONE place this renders, so a reader
// sees the exact same title, in the exact same spot, at the exact same size, whether they're
// just reading or mid-lesson. `heading` arrives already resolved by the caller (LessonPageCard
// gates it behind its own isHeadingVisible for blind-recall SRS stages; ChapterReadingView
// always has it visible) — this component only ever renders what it's handed.
export function PericopeTitle({ book, chapter, verseNumber, heading }: PericopeTitleProps) {
  if (!heading) return <div className="mb-3 h-7" aria-hidden="true" />;
  const pericope = book && chapter !== undefined && verseNumber !== undefined ? getPericopeForVerse(book, chapter, verseNumber) : undefined;
  const span = pericope
    ? pericope.startVerse === pericope.endVerse
      ? `${pericope.chapter}:${pericope.startVerse}`
      : `${pericope.chapter}:${pericope.startVerse}-${pericope.endVerse}`
    : undefined;
  return (
    <p className="mb-3 px-4 text-center font-serif text-base uppercase tracking-widest text-parchment-heading dark:text-zinc-400">
      {heading}
      {span ? ` (${span})` : ""}
    </p>
  );
}
