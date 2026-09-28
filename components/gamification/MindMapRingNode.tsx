"use client";

import type { KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Bookmark, DoorOpen, DoorClosed, type LucideIcon } from "lucide-react";
import { TOGGLE_BADGE_CLASS, mindMapNodeColorVars, type MindMapNodeColor } from "@/lib/mindMapGenreColor";
import { MOTION_DURATION, MOTION_EASE, TAP_SCALE } from "@/lib/motionTokens";
import type { MindMapNodeSize } from "@/lib/useMindMapNodeSizes";
import { MindMapProgressRing } from "@/components/gamification/MindMapProgressRing";
import { Confetti } from "@/components/ui/Confetti";
import { MindMapReviewBadge } from "@/components/gamification/MindMapReviewBadge";
import { MindMapActivePin } from "@/components/gamification/MindMapActivePin";

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
  // A book's crest (see lib/bookEmblems.ts) — drawn on a small medallion at the top of the ring.
  emblem?: LucideIcon;
  // Carries the "you are here" pin (see MindMapActivePin.tsx).
  pinned?: boolean;
  // See MindMapLinks.tsx's own doc comment — only a `pill` node's real rendered size is ever
  // measured off this (its content-sized width/height has no fixed formula the way a plain
  // circle's own `size` does), but set on every kind alike since there's no real cost to it.
  nodeId: string;
  // Which structural ring this is — drives RING_SHADOW_CLASS's own depth-tiered elevation below;
  // threaded down rather than re-derived from `size` so a caller never has to reverse-lookup it.
  kind: keyof typeof RING_SIZE_PX;
  style: { left: number; top: number; scale: number };
  size: number;
  label: string;
  // This node's own 0..1 completion fraction — a chapter's own verses-memorized ratio (see
  // lib/mindMapCompletion.ts's chapterVerseProgress), or every other ring kind's own
  // verse-based `percent / 100` (see lib/canonTree.ts). Drawn as a thin SVG progress ring
  // wrapping the circle on every ring kind alike, so "how far along is this whole branch" reads
  // at a glance from any depth, not just the leaf chapter.
  progress?: number;
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
  // A `pill` node's own real measured box (see lib/useMindMapNodeSizes.ts) — its progress ring
  // (below) traces a stadium/capsule OUTLINE sized to this, not a circle, since a pill is wider
  // than it is tall. Undefined for every non-pill kind (a plain circle needs no measurement,
  // `size` above is already exact) and for one frame before a pill's first real measurement
  // lands, during which its own progress ring simply doesn't draw yet.
  measuredSize?: MindMapNodeSize;
  // True for the one node (chapter OR book) currently mid-celebration (see
  // lib/useMindMapCompletionCelebration.ts) — bursts a confetti burst over the node.
  celebrating?: boolean;
  // Set only when `celebrating` is for a whole BOOK finishing — a second, offset Confetti burst
  // reads as a bigger moment than the plain single-burst chapter tier.
  bookTier?: boolean;
  // SRS state of everything under this node (see lib/srsScopeStatus.ts): `srsDue` turns its
  // progress ring yellow; `lastReviewPct` is the "last review %" badge in its top-right corner.
  srsDue?: boolean;
  lastReviewPct?: number;
  // One of the reader's other active paths (not the one on the map) lives here — a small bookmark
  // on the top-left corner (see lib/mindMapPathTarget.ts's isOtherActivePathAt).
  pathMark?: boolean;
}

// A node's own resting elevation, purely by depth — broader groupings cast a deeper shadow,
// layered on top of the size taper RING_SIZE_PX above already provides.
const RING_SHADOW_CLASS: Record<"testament" | "genre" | "subgenre" | "book" | "theme" | "chapter", string> = {
  testament: "shadow-lg",
  genre: "shadow-lg",
  subgenre: "shadow-md",
  book: "shadow-md",
  theme: "shadow-md",
  chapter: "shadow-sm",
};

// Shared circle (or, for `pill`, capsule) chrome for every toggleable ring (chapter, genre,
// subgenre, testament, theme, and the active book) plus the inactive-book "open" variant — the
// one difference between them is the corner badge (see toggleGlyph) and what a tap does, not the
// shape itself. Split out of MindMapNodeCard.tsx purely to keep that file under this codebase's
// own 200-line file cap (see CLAUDE.md) — no behavior difference from having it inline there.
//
// The root element is a `<div role="button">`, not a real `<button>` — `tabIndex`/`onKeyDown`
// (Enter/Space activate, same as a real button) keep this exactly as keyboard-accessible as the
// `<button>` it replaces.
export function MindMapRingNode({ nodeId, kind, style, size, label, caption, color, expanded, dimmed, toggleGlyph, onClick, pill, measuredSize, celebrating, bookTier, progress, srsDue, lastReviewPct, pathMark, emblem: Emblem, pinned }: MindMapRingNodeProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onClick();
  }

  return (
    <motion.div
      role="button"
      tabIndex={0}
      data-node-id={nodeId}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-expanded={toggleGlyph === "expand" ? expanded : undefined}
      // `left`/`top`/`scale`/`opacity` tween (CAFD re-layout, active-node grow/shrink, dimming)
      // instead of snapping — the constant -50%/-50% centering offset lives in `style.x`/
      // `style.y` (Framer Motion's own recognized transform keys) so it composes with the
      // animated scale automatically. Fades/grows in from nothing on its own first mount
      // (`initial`) — a freshly-expanded branch's own row of circles no longer just pops into
      // place once its data is ready. Opacity is animated here (not a CSS `opacity-25`/
      // `opacity-100` class) specifically so `initial`'s own 0 has an `animate` target to tween
      // toward — the two can't be split across an inline Framer value and a stylesheet class.
      // `whileHover` replaces the old CSS `hover:scale-105` — Framer writes its own inline
      // `transform` here now, which would silently outrank a stylesheet hover rule on the same
      // property.
      initial={{ opacity: 0, scale: 0 }}
      animate={{ ...style, opacity: dimmed ? 0.25 : 1 }}
      transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE.enter }}
      whileTap={TAP_SCALE}
      whileHover={{ scale: 1.05 }}
      style={{ x: "-50%", y: "-50%", ...(pill ? {} : { height: size, width: size }), ...mindMapNodeColorVars(color) }}
      // NOT overflow-hidden on the card itself — every corner badge below is deliberately
      // positioned to overhang this circle's own edge, and a parent's overflow-hidden clips ANY
      // child that pokes past its box, badges included. The label's own overflow-hidden (paired
      // with line-clamp-2) already contains long text on its own.
      className={`absolute flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full border-2 border-[var(--nodeBg)] bg-[var(--nodeBg)] text-[var(--nodeText)] text-center hover:z-10 ${RING_SHADOW_CLASS[kind]} ${pill ? "min-w-[72px] max-w-[118px] px-3 py-1.5" : "p-1"}`}
    >
      <MindMapProgressRing progress={progress} size={size} shape={pill ? "pill" : undefined} measuredSize={measuredSize} due={srsDue} />
      {lastReviewPct !== undefined && <MindMapReviewBadge percent={lastReviewPct} size="md" />}
      {pathMark && (
        <span aria-label="Another of your paths" className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-brand-500 text-white shadow dark:border-zinc-900">
          <Bookmark size={10} strokeWidth={3} />
        </span>
      )}
      {Emblem && (
        <span aria-hidden="true" className="absolute -top-3 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border-2 border-[var(--nodeBg)] bg-parchment text-[#8B6B57] shadow-sm dark:bg-zinc-900">
          <Emblem size={13} strokeWidth={2.5} />
        </span>
      )}
      <span className="line-clamp-2 overflow-hidden font-serif text-[13px] font-bold leading-tight">{label}</span>
      {caption && <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide opacity-70">{caption}</span>}
      {/* This badge is the one visual cue for what tapping the circle does. A door glyph (open
          when expanded, closed when not), not a plain +/-, leans into the canvas's own "memory
          palace" metaphor (see MindMapPericopeGateway.tsx's own doorway styling). */}
      <span
        aria-hidden="true"
        className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 text-white shadow ${TOGGLE_BADGE_CLASS}`}
      >
        {toggleGlyph === "open" ? <ArrowUpRight size={13} strokeWidth={3} /> : expanded ? <DoorOpen size={13} strokeWidth={2.5} /> : <DoorClosed size={13} strokeWidth={2.5} />}
      </span>
      {pinned && <MindMapActivePin raised={!!Emblem} />}
      {celebrating && <Confetti />}
      {celebrating && bookTier && (
        <span className="absolute inset-0 translate-x-2 translate-y-2">
          <Confetti />
        </span>
      )}
    </motion.div>
  );
}
