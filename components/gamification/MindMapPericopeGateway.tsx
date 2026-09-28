"use client";

import { useState, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import type { MindMapPericopeDatum } from "@/lib/mindMapHierarchy";
import { mindMapNodeColor, mindMapNodeColorVars, BRASS_PLAQUE_CLASS } from "@/lib/mindMapGenreColor";
import { MOTION_DURATION, MOTION_EASE, TAP_SCALE } from "@/lib/motionTokens";
import { MindMapMemorizedCheck } from "@/components/gamification/MindMapMemorizedCheck";
import { MindMapHallEditor } from "@/components/gamification/MindMapHallEditor";
import { useProgressStore } from "@/store/useProgressStore";
import { hallDefaultName, hallNameKey, hallShape } from "@/lib/hallEmblems";
import { useShrinkWrapText } from "@/lib/useShrinkWrapText";

// Every room is drawn in its solid color, unchanged by progress (its verses' own checks and trail
// show that); once every verse is memorized it earns the same green check its memorized verse
// chips wear (MindMapMemorizedCheck.tsx).
const CARD_CLASS = "border-[var(--nodeBg)] bg-[var(--nodeBg)] shadow-sm";
// A long heading wraps onto more lines past this width rather than stretching the hall ever wider
// — lib/mindMapVerseStream.ts's hallTitleLines estimates the wrap to leave room for it.
const HALL_TITLE_MAX_WIDTH_CLASS = "max-w-[150px]";

interface MindMapPericopeGatewayProps {
  pericope: MindMapPericopeDatum;
  style: { left: number; top: number; scale: number };
  // This pericope's own 1-based ordinal among its chapter's siblings (see
  // lib/mindMapTreeLayout.ts's own placePericopes) — the plaque's "Hall {n}" number. Undefined
  // only for one frame before the very first layout pass lands (see BookMindMap.tsx).
  hallNumber: number | undefined;
  tagKey: string | undefined;
  // This pericope's own 0..1 fraction of its structural verse range actually reached (see
  // lib/mindMapCompletion.ts's pericopeVerseProgress) — at 1 the hall earns its green check.
  progress: number | undefined;
  onSelect: () => void;
}

// A pericope's own card, styled as an architectural "room gateway" along its chapter's own
// winding spine (see MindMapLinks.tsx) rather than a plain flat rectangle — a brass plaque strip
// (reusing TOGGLE_BADGE_CLASS's own warm bronze tone, the same one every other corner badge on
// this canvas already wears, not a new color) reads "Hall {n} • {verseRange}", the room's own
// address, above its real section-heading label. Split out of MindMapNodeCard.tsx purely to keep
// that file under this codebase's own 200-line file cap (see CLAUDE.md) — no behavior difference
// from having it inline there.
export function MindMapPericopeGateway({ pericope, style, hallNumber, tagKey, progress, onSelect }: MindMapPericopeGatewayProps) {
  const complete = (progress ?? 0) >= 1;
  // A wrapped heading's box hugs its longest line instead of staying at the full max width.
  const titleRef = useShrinkWrapText<HTMLSpanElement>(pericope.label);
  // The plaque shows the hall's own name and place tag, and tapping it opens the hall editor —
  // full-size and easy to type into on a phone (MindMapHallEditor.tsx).
  const [editing, setEditing] = useState(false);
  const hallName = useProgressStore((state) => state.locationTags[hallNameKey(pericope, tagKey)]) ?? hallDefaultName(hallNumber);
  const placeTag = useProgressStore((state) => (tagKey ? state.locationTags[tagKey] : undefined));
  const color = mindMapNodeColor(pericope);
  // Each hall's own doorway silhouette and landmark (see lib/hallEmblems.ts) — so no two
  // neighbouring halls look alike, and each one is recognizable at a glance.
  const shape = hallShape(hallNumber);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelect();
  }

  return (
    <motion.div
      role="button"
      tabIndex={0}
      data-node-id={pericope.id}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      // `left`/`top`/`scale` tween instead of snapping (see lib/motionTokens.ts) — the constant
      // -50%/-50% centering offset lives in `style.x`/`style.y` instead of a manual transform
      // string, so it composes with the animated scale. Fades/grows in from nothing on its own
      // first mount (`initial`) — this card no longer just pops into place the instant its own
      // ESV heading data finishes loading. `whileHover` replaces the old CSS `hover:scale-105`,
      // which an animated inline `transform` here would otherwise outrank.
      initial={{ opacity: 0, scale: 0 }}
      animate={{ ...style, opacity: 1 }}
      transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE.enter }}
      whileTap={TAP_SCALE}
      whileHover={{ scale: 1.05 }}
      style={{ x: "-50%", y: "-50%", ...mindMapNodeColorVars(color) }}
      // A `<div role="button">`, not a real `<button>` — see MindMapRingNode.tsx's own doc
      // comment on why (MindMapPlaqueTagField below nests real `<button>`/`<input>` of its own).
      // Deliberately NOT the card's own visual box (rounded-xl/overflow-hidden/etc. all live on
      // the inner wrapper below). Still shrink-to-fits to the inner wrapper's own content size
      // (a position:absolute block with no explicit width does this automatically), so
      // `data-node-id`'s own measured box (see lib/useMindMapNodeSizes.ts) stays exactly the
      // visual card size.
      className="absolute cursor-pointer hover:z-10"
    >
      {/* Content-sized. The heading is one fixed font size on every card and always shown in FULL
          (a heading is itself a recall cue) — never ellipsized; a long one wraps onto more lines
          (see HALL_TITLE_MAX_WIDTH_CLASS), which the layout makes room for. */}
      <div className={`relative flex min-h-10 min-w-20 flex-col overflow-hidden border text-center text-[var(--nodeText)] ${shape.card} ${CARD_CLASS}`}>
        {/* The room's own brass plaque — its address ("which hall, which verses"), a fixed warm
            bronze regardless of this card's own genre color, the same convention the canvas's
            other corner badges already share (TOGGLE_BADGE_CLASS). When Memory Palace Tags is on
            for this scope (see `tagKey`), it holds TWO independent editable fields, replacing the
            old separate corner icon + popover (MindMapTagBadge/LocationTagField) this design used
            before: the "Hall {n}" label on the left (its own lib/locationTags.ts slot, keyed
            `${tagKey}#hall` so it never collides with the plain tag below) and the memory-palace
            location tag on the right (`+ tag` until set) — the real verse range between them is
            always plain text, never editable (it's a structural fact about the passage, not a
            label the reader gets to rename). */}
        {hallNumber !== undefined && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setEditing(true);
            }}
            onKeyDown={(event) => event.stopPropagation()}
            aria-label={`Edit ${hallName}`}
            className={`relative flex shrink-0 items-center justify-between gap-1 ${shape.plaque} py-0.5 text-[8px] font-semibold uppercase tracking-wide text-white ${BRASS_PLAQUE_CLASS}`}
          >
            <span className="flex min-w-0 shrink items-center gap-0.5">
              <span className="min-w-0 shrink truncate">{hallName}</span>
              {pericope.verseRange && <span className="shrink-0">• {pericope.verseRange}</span>}
            </span>
            {tagKey && <span className="min-w-0 shrink-0 truncate">{placeTag ?? "+ tag"}</span>}
          </button>
        )}
        <span className="relative flex grow items-center justify-center gap-1.5 py-0.5 pl-2 pr-3">
          <span ref={titleRef} className={`${HALL_TITLE_MAX_WIDTH_CLASS} w-[var(--shrink-wrap-width,auto)] text-balance font-serif text-[13px] font-bold leading-snug`}>
            {pericope.label}
          </span>
        </span>
      </div>
      {editing && <MindMapHallEditor pericope={pericope} hallNumber={hallNumber} tagKey={tagKey} onClose={() => setEditing(false)} />}
      {complete && <MindMapMemorizedCheck size="md" />}
    </motion.div>
  );
}
