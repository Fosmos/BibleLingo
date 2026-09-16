import { ChevronLeft, ChevronRight } from "lucide-react";
import type { VerseSegment } from "@/types";

interface GhostContextLineProps {
  verse: VerseSegment | undefined;
  text: string | undefined;
  ellipsis: "leading" | "trailing";
  align: "left" | "right";
  // Tapping this line jumps to that neighboring page — undefined keeps it purely decorative
  // (the default; a caller only ever sets this alongside a real page to jump to, never on an
  // edge with nothing before/after). A small chevron (see CHEVRON below) is the one subtle
  // "this is tappable" cue — otherwise identical to the plain decorative line.
  onNavigate?: () => void;
}

// A single low-opacity, italicized, truncated line of the verse just before/after this page —
// rendered OUTSIDE the parchment card frame itself (never inside it, so it can never disturb
// the card's own auto-sized shape or the spatial anchor every real page's text starts at).
// Reads as a glimpse of what's just off the edge of the current page, not real content of this
// one. Tagged with that neighbor verse's own chapter:verse reference instead of the literal
// words "PREV"/"NEXT" — the reference alone already says which direction it's in. The PREV
// line reads left-aligned, opening with an ellipsis (it's the tail end of a verse cut off
// before this page); the NEXT line reads right-aligned, ending with one (the start of a verse
// cut off after this page) — right-aligning it lines it up under the parchment card's own
// bottom-right corner, since the card auto-sizes to this page's real content instead of always
// stretching to a fixed height (see ParchmentCard).
//
// Shared by ChapterReadingView.tsx (the Path screen's own browsing view) AND
// LessonPageCard.tsx (every Learn/SRS drill stage) — see lib/ghostContext.ts's own
// computeGhostContext, which both callers feed this from.
export function GhostContextLine({ verse, text, ellipsis, align, onNavigate }: GhostContextLineProps) {
  if (!text || !verse) return <div className="h-5" aria-hidden="true" />;
  const reference = `${verse.chapter}:${verse.verseNumber}`;
  const body = ellipsis === "leading" ? `… ${text}` : `${text} …`;
  const Chevron = ellipsis === "leading" ? ChevronLeft : ChevronRight;
  const lineClass = `truncate px-4 text-base italic text-ink-muted opacity-40 ${align === "right" ? "text-right" : "text-left"}`;
  const label = <>
    <span className="mr-1 font-semibold not-italic">{reference}</span>
    {body}
  </>;

  if (!onNavigate) return <p className={lineClass}>{label}</p>;

  return (
    <button
      type="button"
      onClick={onNavigate}
      aria-label={`Go to ${ellipsis === "leading" ? "previous" : "next"} page, starting ${reference}`}
      className={`flex w-full items-center gap-1 transition hover:opacity-70 ${align === "right" ? "flex-row-reverse" : ""}`}
    >
      <Chevron size={14} className="shrink-0 text-ink-muted opacity-40" aria-hidden="true" />
      <span className={`min-w-0 flex-1 ${lineClass}`}>{label}</span>
    </button>
  );
}
