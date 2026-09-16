"use client";

import { Plus, Minus, ArrowUpRight } from "lucide-react";
import { TOGGLE_BADGE_CLASS, mindMapNodeColorVars, type MindMapNodeColor } from "@/lib/mindMapGenreColor";

// Circle diameter per structural ring, tapering from Testament (broadest) down to Chapter
// (narrowest) — a purely visual cue that these sit at different scopes, since the tree itself
// already conveys hierarchy through position; this just keeps the eye from reading every ring
// as interchangeable circles. Theme sits between Book and Chapter positionally, but reads
// slightly LARGER than Book — a theme summarizes several of that same book's own chapters, so
// visually outranking a single book's own ring reinforces "this is the bigger grouping," not a
// finer-grained one.
export const RING_SIZE_PX: Record<"testament" | "genre" | "subgenre" | "book" | "theme" | "chapter", number> = {
  testament: 72,
  genre: 64,
  subgenre: 62,
  theme: 66,
  book: 60,
  chapter: 56,
};

interface MindMapRingNodeProps {
  // See MindMapLinks.tsx's own doc comment — only a `pill` node's real rendered size is ever
  // measured off this (its content-sized width/height has no fixed formula the way a plain
  // circle's own `size` does), but set on every kind alike since there's no real cost to it.
  nodeId: string;
  style: { left: number; top: number; transform: string };
  size: number;
  label: string;
  // A theme node's own chapter span (e.g. "Ch 2–8") — a small second line under `label`, the
  // same role a pericope card's own verseRange plays. Every other kind leaves this undefined.
  caption?: string;
  // This node's own resolved color (see lib/mindMapGenreColor.ts) — a flat fill/border/text,
  // fixed by depth+category for most nodes, or a left-to-right gradient tint for the active
  // book's own direct children. Applied via CSS custom properties (see mindMapNodeColorVars)
  // since these are specific design hex values, not a small fixed set of Tailwind classes.
  color: MindMapNodeColor;
  expanded: boolean;
  // Contextual Accordion Focus-Dimming (CAFD, see BookMindMap.tsx's own doc comment) — ghosts
  // this circle to 25% opacity when it isn't on the single currently-open branch.
  dimmed: boolean;
  toggleGlyph: "expand" | "open";
  onClick: () => void;
  // A theme node's own label ("Galilean Ministry," "The Passion Week") is real prose, not a
  // short number or single word — a plain fixed-diameter circle either clips it or forces a tiny
  // font. Pill nodes size by their own content instead (min/max width + horizontal padding, a
  // capsule since rounded-full still fully rounds a non-square box), same "wide enough for the
  // words" shape a pericope card already uses for ITS OWN label. Only theme nodes pass this.
  pill?: boolean;
}

// Shared circle (or, for `pill`, capsule) chrome for every toggleable ring (chapter, genre,
// subgenre, testament, theme, and the active book) plus the inactive-book "open" variant — the
// one difference between them is the corner badge (see toggleGlyph) and what a tap does, not the
// shape itself. Split out of MindMapNodeCard.tsx purely to keep that file under this codebase's
// own 200-line file cap (see CLAUDE.md) — no behavior difference from having it inline there.
export function MindMapRingNode({ nodeId, style, size, label, caption, color, expanded, dimmed, toggleGlyph, onClick, pill }: MindMapRingNodeProps) {
  return (
    <button
      type="button"
      data-node-id={nodeId}
      onClick={onClick}
      aria-expanded={toggleGlyph === "expand" ? expanded : undefined}
      style={{ ...(pill ? style : { ...style, height: size, width: size }), ...mindMapNodeColorVars(color) }}
      // NOT overflow-hidden on the button itself — the badge below is deliberately positioned
      // to overhang this circle's own edge (-bottom-1 -right-1), and a parent's overflow-hidden
      // clips ANY child that pokes past its box, badge included. The label's own overflow-
      // hidden (paired with line-clamp-2) already contains long text on its own. `transition`
      // (not just transition-transform) so CAFD's own opacity dimming animates too, not just hover's scale.
      className={`absolute flex flex-col items-center justify-center gap-0.5 rounded-full border-2 border-[var(--nodeBg)] bg-[var(--nodeBg)] text-[var(--nodeText)] text-center shadow-sm transition hover:z-10 hover:scale-105 ${pill ? "min-w-[72px] max-w-[118px] px-3 py-1.5" : "p-1"} ${dimmed ? "opacity-25" : "opacity-100"}`}
    >
      <span className="line-clamp-2 overflow-hidden font-serif text-[13px] font-bold leading-tight">{label}</span>
      {caption && <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide opacity-70">{caption}</span>}
      {/* This badge is the one visual cue telling the reader what tapping the circle does —
          reveal (or hide) what's under it, or open a different book entirely — since nothing
          else about a plain circle says either on its own. A solid warm-copper fill with a
          white border pops off every one of this node's own possible colors. */}
      <span
        aria-hidden="true"
        className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 text-white shadow ${TOGGLE_BADGE_CLASS}`}
      >
        {toggleGlyph === "open" ? <ArrowUpRight size={13} strokeWidth={3} /> : expanded ? <Minus size={13} strokeWidth={3} /> : <Plus size={13} strokeWidth={3} />}
      </span>
    </button>
  );
}
