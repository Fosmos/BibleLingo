"use client";

import { Plus, Minus } from "lucide-react";
import type { MindMapDatum } from "@/lib/mindMapHierarchy";
import type { PericopeCardStatus } from "@/lib/pericopeCardState";

interface MindMapNodeCardProps {
  datum: MindMapDatum;
  x: number;
  y: number;
  expanded: boolean;
  onSelectPericope: (chapter: number, startVerse?: number) => void;
  onToggleChapter: (chapterId: string) => void;
}

// locked matches brand-50 (#F5F1EC), active/completed use Tailwind's own default amber/emerald
// scales — the one deliberate departure from this app's otherwise-monochrome brand palette,
// since memorization status is the one thing on this whole canvas that's actually meant to
// read as a traffic-light at a glance. One shared PericopeCardStatus map now covers both the
// chapter ring and the pericope ring — they used to be two different enums with the same three
// real states (see lib/pericopeCardState.ts's own history), unified once the pericope ring
// started computing its status via computeZoneCardState too (see lib/mindMapHierarchy.ts).
const STATUS_CLASS: Record<PericopeCardStatus, string> = {
  locked: "bg-brand-50 border-line text-ink-muted dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-500",
  active: "bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-200",
  completed: "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300",
};
const CHAPTER_STATUS_CLASS: Record<PericopeCardStatus, string> = {
  locked: "bg-white border-brand-400 text-brand-600 dark:bg-zinc-900 dark:border-brand-600 dark:text-brand-300",
  active: "bg-amber-100 border-amber-400 text-amber-900 dark:bg-amber-900/40 dark:border-amber-600 dark:text-amber-200",
  completed: "bg-emerald-50 border-emerald-400 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-600 dark:text-emerald-300",
};

// One tree node's own card, sized and styled by `datum.kind`, centered on its own (x, y) via
// a translate(-50%, -50%) — lib/mindMapTreeLayout.ts's own layout coordinates are each node's
// CENTER, not its top-left corner. A pericope node opens its own chapter's parchment view on
// tap (see BookMindMap.tsx's onSelectChapter); a chapter node toggles its own pericopes open/
// closed instead (see BookMindMap.tsx's expandedChapters) — book/chapter nodes were purely
// structural before pericope-level collapsing existed, but a chapter is very much a tap
// target now, just for a different job than a pericope's.
export function MindMapNodeCard({ datum, x, y, expanded, onSelectPericope, onToggleChapter }: MindMapNodeCardProps) {
  const style = { left: x, top: y, transform: "translate(-50%, -50%)" } as const;

  if (datum.kind === "pericope") {
    return (
      <button
        type="button"
        onClick={() => onSelectPericope(datum.chapter, datum.startVerse)}
        style={style}
        // w-20/h-16 are load-bearing, not decorative — lib/mindMapTreeLayout.ts's own
        // MIN_LEAF_ARC spaces neighboring pericope cards apart assuming EXACTLY this
        // footprint, never a larger one that text could grow into. line-clamp + overflow-
        // hidden together are what guarantee that: a heading that doesn't fit gets cut off
        // with an ellipsis rather than wrapping the card taller or spilling past its own
        // edges into a neighbor. Deliberately NOT break-words — line-clamp's own ellipsis
        // already backs off to the last whole word that fits when wrapping is word-boundary-
        // only; break-words instead lets it slice straight through the middle of whatever
        // word happens to land on the cut line (e.g. "Withered Fig" clipping to "Withered
        // Fi…"), which reads as broken rather than intentionally truncated.
        className={`absolute flex h-16 w-20 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-xl border p-1.5 text-center shadow-sm transition-transform hover:z-10 hover:scale-105 ${STATUS_CLASS[datum.status]}`}
      >
        <span className="line-clamp-2 font-serif text-[10px] font-semibold leading-snug">{datum.label}</span>
        {datum.verseRange && <span className="shrink-0 text-[8px] font-medium uppercase tracking-wide opacity-70">{datum.verseRange}</span>}
      </button>
    );
  }

  if (datum.kind === "chapter") {
    return (
      <button
        type="button"
        onClick={() => onToggleChapter(datum.id)}
        aria-expanded={expanded}
        style={style}
        // NOT overflow-hidden on the button itself — the expand/collapse badge below is
        // deliberately positioned to overhang this circle's own edge (-bottom-1 -right-1),
        // and a parent's overflow-hidden clips ANY child that pokes past its box, badge
        // included, cutting the +/− glyph off mid-icon. The label's own overflow-hidden
        // (paired with line-clamp-1 just below) already contains long text on its own — it
        // doesn't need the button's help for that.
        className={`absolute flex h-14 w-14 items-center justify-center rounded-full border-2 text-center font-serif text-sm font-bold shadow-sm transition-transform hover:z-10 hover:scale-105 ${CHAPTER_STATUS_CLASS[datum.status]}`}
      >
        <span className="line-clamp-1 overflow-hidden">Ch {datum.label}</span>
        {/* A chapter is always a toggle, never a dead end — this badge is the one visual cue
            telling the reader tapping it reveals (or hides) its own pericopes rather than
            navigating anywhere, since nothing else about a plain circle says "expandable." A
            solid brand-colored fill (not white-on-white) keeps it legible regardless of which
            of the three status colors the chapter circle itself happens to be — a real glyph
            icon, not a raw "+"/"−" text character, so it stays crisp at this size instead of
            risking a barely-visible hairline dash depending on the font's own glyph metrics. */}
        <span
          aria-hidden="true"
          className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-brand-500 text-white shadow dark:border-zinc-900"
        >
          {expanded ? <Minus size={13} strokeWidth={3} /> : <Plus size={13} strokeWidth={3} />}
        </span>
      </button>
    );
  }

  return (
    <div
      style={style}
      className="absolute flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-brand-500 bg-brand-500 px-1.5 text-center font-serif text-sm font-bold text-white shadow-md"
    >
      <span className="line-clamp-3">{datum.label}</span>
    </div>
  );
}
