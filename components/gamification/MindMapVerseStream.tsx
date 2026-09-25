"use client";

import { motion } from "framer-motion";
import type { MindMapVerseChip } from "@/lib/mindMapLayoutTypes";
import type { MindMapPericopeDatum } from "@/lib/mindMapHierarchy";
import { verseChipColor, mindMapNodeColorVars } from "@/lib/mindMapGenreColor";
import { VERSE_CHIP_SIZE_PX } from "@/lib/mindMapVerseStream";
import { MOTION_DURATION, MOTION_EASE, TAP_SCALE } from "@/lib/motionTokens";
import { MindMapMemorizedCheck } from "@/components/gamification/MindMapMemorizedCheck";
import { MindMapActivePin } from "@/components/gamification/MindMapActivePin";
import { MindMapReviewBadge } from "@/components/gamification/MindMapReviewBadge";
import { useProgressStore } from "@/store/useProgressStore";
import { srsScopeStatus } from "@/lib/srsScopeStatus";
import { isVerseLearned } from "@/lib/pericopeLearned";
import type { LayoutPoint } from "@/lib/mindMapLayoutTypes";
import { MindMapHallEmblem } from "@/components/gamification/MindMapHallEmblem";

interface MindMapVerseStreamProps {
  pericope: MindMapPericopeDatum;
  // Verses due their review in today's lesson (see lib/useYesterdayReview.ts) — yellow checks.
  reviewDueKeys?: Set<string>;
  // Where this hall's landmark stands beside its verses (see MindMapHallEmblem.tsx) — none drawn
  // when undefined.
  emblem?: LayoutPoint & { size: number };
  // Already positioned in the SAME canvas coordinate space every other layer on this canvas
  // uses (see lib/mindMapTreeLayout.ts's own placePericopes, which strings these directly below
  // the pericope's own card and folds them into the chapter's own shared spine curve — the
  // connecting line itself is MindMapLinks.tsx's own job, not this component's).
  verseChips: MindMapVerseChip[];
  // Its hall number among its chapter's halls — sets the hall's place colour (see
  // lib/mindMapPlaceColor.ts), which its verse chips wear a lighter cut of.
  hallNumber: number | undefined;
  // The one chip carrying the bobbing "you are here" pin (see MindMapActivePin.tsx) — worked out
  // by the caller, since only it knows whether a lesson is open. Undefined draws no pin.
  pinVerseNumber?: number;
  // Today's lesson verses (see lib/mindMapVerseStream.ts's todaysLessonVerseKeys) — any of this
  // stream's chips among them that isn't memorized yet pulses outward. Empty inside a lesson.
  todayVerseKeys?: Set<string>;
  onSelectVerse: (chapter: number, verseNumber: number) => void;
}

// A pericope's own unrolled verses (see MindMapPericopeGateway.tsx's own expand toggle) — one
// `v{n}` chip per real verse in its structural range, strung along the chapter's own spine
// directly below the card, continuing on to wherever the next pericope ends up. Tapping a chip
// navigates straight to that exact verse (see BookMindMap.tsx's own onSelectVerse) — the
// pericope card's own tap no longer does that itself now that it toggles this stream instead.
export function MindMapVerseStream({ pericope, reviewDueKeys, emblem, verseChips, hallNumber, pinVerseNumber, todayVerseKeys, onSelectVerse }: MindMapVerseStreamProps) {
  const color = verseChipColor(pericope);
  const entities = useProgressStore((state) => state.memorizedEntities);
  // Each chip's own "last review %" (see lib/srsScopeStatus.ts) — read off one subscription for
  // the whole stream rather than one per chip.
  const lastReview = (verseNumber: number) =>
    srsScopeStatus(entities, { book: pericope.book, chapter: pericope.chapter, startVerse: verseNumber, endVerse: verseNumber }).lastAccuracy;
  const memorized = (verseNumber: number) => isVerseLearned(pericope, verseNumber);

  return (
    <>
      {emblem && <MindMapHallEmblem pericope={pericope} hallNumber={hallNumber} point={emblem} />}
      {verseChips.map((chip) => {
        const reviewPct = lastReview(chip.verseNumber);
        const pulsing = !memorized(chip.verseNumber) && (todayVerseKeys?.has(`${pericope.book}:${pericope.chapter}:${chip.verseNumber}`) ?? false);
        return (
          <motion.button
            key={chip.verseNumber}
            type="button"
            onClick={() => onSelectVerse(pericope.chapter, chip.verseNumber)}
            // Tweens instead of snapping (see lib/motionTokens.ts) — a chip's own (x, y) shifts
            // whenever an earlier pericope's own real height changes. Fades/grows in from nothing
            // on its own first mount (`initial`) rather than popping in instantly once the
            // pericope's own ESV heading data finishes loading. `whileHover` replaces the old CSS
            // `hover:scale-110`, which an animated inline `transform` here would otherwise outrank.
            initial={{ opacity: 0, scale: 0 }}
            animate={{ left: chip.x, top: chip.y, opacity: 1, scale: 1 }}
            transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE.enter }}
            whileTap={TAP_SCALE}
            whileHover={{ scale: 1.1 }}
            style={{
              // Sized by the verse's length (see lib/mindMapHallGeometry.ts).
              width: chip.size ?? VERSE_CHIP_SIZE_PX,
              height: chip.size ?? VERSE_CHIP_SIZE_PX,
              x: "-50%",
              y: "-50%",
              ...mindMapNodeColorVars(color),
            }}
            // Every chip is drawn solid; a memorized one also wears the green check — the same
            // comparison lib/mindMapPericopeSpine.ts uses to draw the trail beneath it dashed vs.
            // solid, so chip and trail always agree.
            className="absolute flex items-center justify-center rounded-full border border-[var(--nodeBg)] bg-[var(--nodeBg)] text-[9px] font-semibold text-[var(--nodeText)] shadow-sm transition hover:z-10"
          >
            {/* Today's verses to learn: a halo of the chip's own color swelling outward and fading,
                over and over. Painted behind the label (negative z inside the chip's own stacking
                context), so at rest it just blends into the chip. */}
            {pulsing && (
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[var(--nodeBg)]"
                // Starts AND ends invisible, so each loop's restart (back to scale 1) never shows —
                // restarting from a visible halo read as a flicker at the chip's edge.
                animate={{ scale: [1, 1.35, 1.9], opacity: [0, 0.6, 0] }}
                transition={{ duration: 1.8, times: [0, 0.2, 1], repeat: Infinity, ease: "easeOut" }}
              />
            )}
            {memorized(chip.verseNumber) && (
              <MindMapMemorizedCheck size="sm" reviewDue={reviewDueKeys?.has(`${pericope.book}:${pericope.chapter}:${chip.verseNumber}`)} />
            )}
            {chip.verseNumber === pinVerseNumber && <MindMapActivePin />}
            {reviewPct !== undefined && <MindMapReviewBadge percent={reviewPct} size="sm" />}
            v{chip.verseNumber}
          </motion.button>
        );
      })}
    </>
  );
}
