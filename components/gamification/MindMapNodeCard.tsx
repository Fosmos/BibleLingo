"use client";

import { ArrowUpRight } from "lucide-react";
import type { MindMapDatum } from "@/lib/mindMapHierarchy";
import { mindMapNodeColor, mindMapNodeColorVars, ROOT_COLOR, TOGGLE_BADGE_CLASS } from "@/lib/mindMapGenreColor";
import { MindMapRingNode, RING_SIZE_PX } from "@/components/gamification/MindMapRingNode";

interface MindMapNodeCardProps {
  datum: MindMapDatum;
  x: number;
  y: number;
  expanded: boolean;
  // Contextual Accordion Focus-Dimming (CAFD, see BookMindMap.tsx's own doc comment) — true for
  // any node NOT on the single currently-open branch, false for the root node (never dimmed,
  // always the trunk everything else hangs from) and for every node that IS on that branch.
  // Ghosts the card to 25% opacity rather than hiding it outright — still visibly there, still
  // tappable, just clearly not the current focus.
  dimmed: boolean;
  // Whichever node was tapped last (the deepest id on `activePath`) renders larger; its own
  // sibling row shrinks to make room and to visually recede — see BookMindMap.tsx's own
  // sizeScaleFor. 1 for every other node (the ordinary size).
  sizeScale: number;
  // True for any node on the real chain down to TODAY's own actual lesson (see
  // lib/mindMapActivePath.ts's activeChainIds) — this node's own color reads as its "active"
  // tone (see lib/mindMapGenreColor.ts) rather than its ordinary inactive one.
  onActiveChain: boolean;
  // This node's own 0..1 left-to-right position among the active book's OWN direct children
  // (see BookMindMap.tsx) — undefined for every node that isn't one of those. Overrides the
  // ordinary active/inactive color with the left-to-right teal-to-pale-slate fade.
  gradientT?: number;
  // `book` lets the caller (see BookMindMap.tsx) tell a real active-book pericope (opens that
  // chapter's own parchment view) apart from a browsed book's own pericope (offers to switch
  // there instead).
  onSelectPericope: (chapter: number, startVerse: number | undefined, book: string) => void;
  onToggleNode: (id: string) => void;
}

// One tree node's own card, sized and styled by `datum.kind`, centered on its own (x, y) via a
// translate(-50%, -50%) — lib/mindMapTreeLayout.ts's own layout coordinates are each node's
// CENTER, not its top-left corner.
//
// Tap behavior by kind:
// - pericope: for the real active book, opens its own chapter's parchment view (see
//   BookMindMap.tsx's onSelectPericope); for a browsed (non-active) book, instead offers to
//   switch the active path there (see onSelectPericope's own `book` param) — marked with the
//   same arrow badge either way.
// - chapter, theme, genre, subgenre, testament, and EVERY book (active or just being browsed):
//   toggle their own children open/closed (see onToggleNode) — every one of these is a real
//   expand/collapse target, marked with the same +/- badge so that affordance reads consistently
//   no matter which ring it's on. Switching which book is the real ACTIVE learning path is a
//   separate action (see onSwitchBook) — the floating "Start learning" button BookMindMap.tsx
//   shows once a non-active book is open, not this tap.
// - root ("The Bible"): purely structural, never a tap target, no badge at all.
//
// Every OTHER node kind carries some corner badge — a pericope card is deliberately no
// exception, even though it's a leaf: without one, it would be the one plain, unmarked card on
// the whole canvas, reading as inert next to everything else's own visible "tap me" cue.
export function MindMapNodeCard({ datum, x, y, expanded, dimmed, sizeScale, onActiveChain, gradientT, onSelectPericope, onToggleNode }: MindMapNodeCardProps) {
  const style = { left: x, top: y, transform: `translate(-50%, -50%) scale(${sizeScale})` };

  if (datum.kind === "pericope") {
    const color = mindMapNodeColor(datum, datum.status === "active", gradientT);
    return (
      <button
        type="button"
        data-node-id={datum.id}
        onClick={() => onSelectPericope(datum.chapter, datum.startVerse, datum.book)}
        style={{ ...style, ...mindMapNodeColorVars(color) }}
        // NOT overflow-hidden on the button itself — the badge below is deliberately
        // positioned to overhang this card's own corner (-bottom-1 -right-1), same convention
        // MindMapRingNode.tsx uses, so every node on the canvas carries the same one visual cue
        // for "tapping this does something." Content-sized (min/max width, no fixed/clamped
        // height), same "pill" shape MindMapRingNode.tsx's theme nodes already use — no
        // line-clamp/truncation, so a real ESV section heading always shows in full rather than
        // ellipsizing. lib/mindMapTreeLayout.ts's own PERICOPE_STEP_PX/PERICOPE_SIDE_OFFSET_PX
        // are sized generously enough to clear a realistic multi-line card at this max-width —
        // see that file's own doc comment. `transition` (not just transition-transform) so
        // CAFD's own opacity dimming animates too, not just hover's scale.
        className={`absolute flex min-h-16 min-w-20 max-w-[150px] flex-col items-center justify-center gap-0.5 rounded-xl border border-[var(--nodeBg)] bg-[var(--nodeBg)] text-[var(--nodeText)] p-1.5 text-center shadow-sm transition hover:z-10 hover:scale-105 ${dimmed ? "opacity-25" : "opacity-100"}`}
      >
        <span className="font-serif text-[11px] font-bold leading-snug">{datum.label}</span>
        {datum.verseRange && <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide opacity-70">{datum.verseRange}</span>}
        {/* Opens this pericope's own verses — the same arrow badge an inactive book's own
            "opens this book" affordance uses, so every card on the canvas carries SOME corner
            badge rather than a pericope being the one plain, unmarked exception. */}
        <span
          aria-hidden="true"
          className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 text-white shadow ${TOGGLE_BADGE_CLASS}`}
        >
          <ArrowUpRight size={11} strokeWidth={3} />
        </span>
      </button>
    );
  }

  if (datum.kind === "chapter") {
    return (
      <MindMapRingNode
        style={style}
        size={RING_SIZE_PX.chapter}
        label={`Ch ${datum.label}`}
        color={mindMapNodeColor(datum, datum.status === "active", gradientT)}
        expanded={expanded}
        dimmed={dimmed}
        toggleGlyph="expand"
        onClick={() => onToggleNode(datum.id)}
      />
    );
  }

  if (datum.kind === "theme") {
    return (
      <MindMapRingNode
        style={style}
        size={RING_SIZE_PX.theme}
        label={datum.label}
        caption={`Ch ${datum.reference}`}
        color={mindMapNodeColor(datum, onActiveChain, gradientT)}
        expanded={expanded}
        dimmed={dimmed}
        toggleGlyph="expand"
        onClick={() => onToggleNode(datum.id)}
        pill
      />
    );
  }

  // Tapping any book (active OR not) toggles its own chapter ring open/closed — see
  // BookMindMap.tsx's own browse support (lib/mindMapBrowseTree.ts). Switching which book is
  // the real ACTIVE learning path is a separate action (see onSwitchBook), not this tap; an
  // active book's own ring just also happens to already be pre-expanded by default.
  if (datum.kind === "book" || datum.kind === "genre" || datum.kind === "subgenre" || datum.kind === "testament") {
    return (
      <MindMapRingNode
        style={style}
        size={RING_SIZE_PX[datum.kind]}
        label={datum.label}
        color={mindMapNodeColor(datum, onActiveChain, gradientT)}
        expanded={expanded}
        dimmed={dimmed}
        toggleGlyph="expand"
        onClick={() => onToggleNode(datum.id)}
      />
    );
  }

  return (
    <div
      style={{ ...style, ...mindMapNodeColorVars(ROOT_COLOR) }}
      className="absolute flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--nodeBg)] bg-[var(--nodeBg)] text-[var(--nodeText)] px-1.5 text-center font-serif text-sm font-bold shadow-md"
    >
      <span className="line-clamp-3">{datum.label}</span>
    </div>
  );
}
