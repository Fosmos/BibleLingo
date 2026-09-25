"use client";

import { motion } from "framer-motion";
import type { LocationTagLevel } from "@/types";
import type { MindMapDatum } from "@/lib/mindMapHierarchy";
import { mindMapNodeColor, mindMapNodeColorVars, ROOT_COLOR } from "@/lib/mindMapGenreColor";
import { chapterVerseProgress, pericopeVerseProgress } from "@/lib/mindMapCompletion";
import { mindMapTagKey } from "@/lib/mindMapTagKey";
import { srsScopeForDatum } from "@/lib/mindMapSrsScope";
import { useSrsScopeStatus } from "@/lib/useSrsScopeStatus";
import { useActivePathKeys } from "@/lib/useActivePathKeys";
import { isOtherActivePathAt, mapHostPathKey } from "@/lib/mindMapPathTarget";
import { useProgressStore } from "@/store/useProgressStore";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";
import { MindMapRingNode, RING_SIZE_PX } from "@/components/gamification/MindMapRingNode";
import type { MindMapNodeSize } from "@/lib/useMindMapNodeSizes";
import { MindMapPericopeGateway } from "@/components/gamification/MindMapPericopeGateway";
import { MindMapActivePin } from "@/components/gamification/MindMapActivePin";
import { bookEmblem } from "@/lib/bookEmblems";

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
  // This node's own real measured DOM box (see lib/useMindMapNodeSizes.ts) — only ever read for
  // a `pill` (theme) node's own progress ring below, which has to trace the pill's real content
  // size rather than a fixed circle. Undefined for one frame before the first measurement lands,
  // same as every other consumer of this map (see MindMapLinks.tsx's own fallback convention).
  measuredSize?: MindMapNodeSize;
  // A pericope's own "Hall {n}" plaque number (see lib/mindMapTreeLayout.ts's own
  // placePericopes) — undefined for every other kind.
  hallNumber?: number;
  // Opens a real active-book pericope's own starting verse in the chapter's reading view, or
  // offers to switch the active path there for a browsed book's own pericope — see
  // BookMindMap.tsx's own onSelectPericope.
  onSelectPericope: (pericope: { id: string; book: string; chapter: number; startVerse?: number }) => void;
  onToggleNode: (id: string) => void;
  // Which scopes currently show an editable location tag on a pericope's own plaque —
  // Settings > Advanced > Memory Palace Tags (see UserProgress.locationTagLevels) — passed
  // through to lib/mindMapTagKey.ts.
  locationTagLevels: LocationTagLevel[];
  // True for the one node (chapter or book) currently mid-celebration (see
  // lib/useMindMapCompletionCelebration.ts).
  celebrating?: boolean;
  // True only when `celebrating` is for a whole BOOK, not just a chapter — see
  // MindMapRingNode.tsx's own `bookTier` doc comment. Only ever meaningful for a book-kind datum.
  celebratingBookTier?: boolean;
  // Carries the "you are here" pin — the reader's place, while its verse isn't on screen (see
  // lib/mindMapVerseStream.ts's pinnedRingId).
  pinned?: boolean;
}

// One tree node's own card, sized and styled by `datum.kind`, centered on its own (x, y) via a
// translate(-50%, -50%) — lib/mindMapTreeLayout.ts's own layout coordinates are each node's
// CENTER, not its top-left corner.
//
// Tap behavior by kind:
// - pericope: for the real active book, opens its own starting verse in the chapter's reading
//   view (its own verse stream is already showing below without a tap — every pericope under an
//   open chapter unrolls together, see lib/mindMapPericopeSpine.ts); for a browsed (non-active)
//   book, instead offers to switch the active path there — both via onSelectPericope.
// - chapter, theme, genre, subgenre, testament, and EVERY book (active or just being browsed):
//   toggle their own children open/closed (see onToggleNode) — every one of these is a real
//   expand/collapse target, marked with the same door-glyph badge so that affordance reads
//   consistently no matter which ring it's on. Switching which book is the real ACTIVE learning
//   path is a separate action (see BookMindMap.tsx's onChoosePath) — the path tab
//   BookMindMap.tsx shows once a non-active book is open, not this tap.
// - root ("The Bible"): purely structural, never a tap target, no badge at all.
export function MindMapNodeCard({ datum, x, y, expanded, dimmed, sizeScale, measuredSize, hallNumber, onSelectPericope, onToggleNode, locationTagLevels, celebrating, celebratingBookTier, pinned }: MindMapNodeCardProps) {
  // `left`/`top`/`scale` (not a pre-built transform string) — MindMapRingNode.tsx/
  // MindMapPericopeGateway.tsx/the root div below each feed these into a motion.div's own
  // `animate`, so CAFD re-layout and chapter-select push-down tween smoothly instead of
  // snapping; the constant -50%/-50% centering offset lives in each of THEIR OWN `style.x`/
  // `style.y` instead (Framer Motion's own recognized transform keys, which it composes with
  // an animated `scale` automatically — plain `translateX`/`translateY` would NOT compose the
  // same way).
  const style = { left: x, top: y, scale: sizeScale };
  const tagKey = mindMapTagKey(datum, locationTagLevels);
  const srs = useSrsScopeStatus(srsScopeForDatum(datum));
  const activeKeys = useActivePathKeys();
  const focusedKey = useProgressStore((state) => state.activePathKey);
  // Marks every active path other than the one drawn (which may be broader than the focused one).
  const pathMark = isOtherActivePathAt(datum, activeKeys, focusedKey ? mapHostPathKey(focusedKey, activeKeys) : null);

  if (datum.kind === "pericope") {
    return (
      <MindMapPericopeGateway
        pericope={datum}
        style={style}
        hallNumber={hallNumber}
        tagKey={tagKey}
        progress={pericopeVerseProgress(datum)}
        lastReviewPct={srs.lastAccuracy}
        onSelect={() => onSelectPericope(datum)}
      />
    );
  }

  if (datum.kind === "chapter") {
    return (
      <MindMapRingNode
        nodeId={datum.id}
        pinned={pinned}
        kind="chapter"
        style={style}
        size={RING_SIZE_PX.chapter}
        label={`Ch ${datum.label}`}
        progress={Math.max(chapterVerseProgress(datum), datum.memorizedFraction ?? 0)}
        color={mindMapNodeColor(datum)}
        expanded={expanded}
        dimmed={dimmed}
        toggleGlyph="expand"
        onClick={() => onToggleNode(datum.id)}
        celebrating={celebrating}
        srsDue={srs.due}
        lastReviewPct={srs.lastAccuracy}
        pathMark={pathMark}
      />
    );
  }

  if (datum.kind === "theme") {
    return (
      <MindMapRingNode
        nodeId={datum.id}
        pinned={pinned}
        kind="theme"
        style={style}
        size={RING_SIZE_PX.theme}
        label={datum.label}
        caption={`Ch ${datum.reference}`}
        progress={datum.percent / 100}
        measuredSize={measuredSize}
        color={mindMapNodeColor(datum)}
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
  // the real ACTIVE learning path is offered separately (see onChoosePath), not this tap; an
  // active book's own ring just also happens to already be pre-expanded by default.
  if (datum.kind === "book" || datum.kind === "genre" || datum.kind === "subgenre" || datum.kind === "testament") {
    return (
      <MindMapRingNode
        nodeId={datum.id}
        pinned={pinned}
        kind={datum.kind}
        style={style}
        size={RING_SIZE_PX[datum.kind]}
        label={datum.label}
        progress={datum.percent / 100}
        color={mindMapNodeColor(datum)}
        expanded={expanded}
        dimmed={dimmed}
        toggleGlyph="expand"
        onClick={() => onToggleNode(datum.id)}
        celebrating={datum.kind === "book" ? celebrating : undefined}
        bookTier={datum.kind === "book" ? celebratingBookTier : undefined}
        // A book's ring only ever shows progress (green) — "review due" yellow is for its chapters.
        srsDue={datum.kind === "book" ? false : srs.due}
        lastReviewPct={srs.lastAccuracy}
        pathMark={pathMark}
        emblem={datum.kind === "book" ? bookEmblem(datum.name)?.Icon : undefined}
      />
    );
  }

  return (
    <motion.div
      animate={style}
      transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE.enter }}
      style={{ x: "-50%", y: "-50%", ...mindMapNodeColorVars(ROOT_COLOR) }}
      className="absolute flex h-20 w-20 items-center justify-center rounded-full border-2 border-[var(--nodeBg)] bg-[var(--nodeBg)] text-[var(--nodeText)] px-1.5 text-center font-serif text-sm font-bold shadow-md"
    >
      <span className="line-clamp-3">{datum.label}</span>
      {pinned && <MindMapActivePin />}
    </motion.div>
  );
}
