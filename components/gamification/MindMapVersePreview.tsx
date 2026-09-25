"use client";

import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { VerseSegment } from "@/types";
import { TAP_SCALE } from "@/lib/motionTokens";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { useExpandedVerseZone } from "@/lib/useExpandedVerseZone";
import { useElementWidth } from "@/lib/useElementWidth";
import { SenseLineVerse } from "@/components/gamification/SenseLineVerse";
import { SheetVerseZone } from "@/components/gamification/SheetVerseZone";
import { SheetDrillPortal } from "@/components/gamification/SheetDrillPortal";

interface MindMapVersePreviewProps {
  verse: VerseSegment | undefined;
  learned: boolean;
  // The one thing to do with it — "Learn/Continue/Review …" for a verse in the active path (see
  // lib/verseLessonAction.ts), or "Memorize …" for one outside it (see
  // MindMapVerseTargetPreview.tsx). No label: no button.
  actionLabel: string | undefined;
  onAction: () => void;
  // A second, quieter option — "Learn just vN" when the lesson covers more than this one verse
  // (its own single-verse path, see lib/singleVersePath.ts), or "Memorize again" for a verse
  // already memorized.
  secondary?: { label: string; onClick: () => void };
  // A line shown in place of the main button — e.g. that the verse is already memorized.
  status?: string;
}

const NO_TAGS: Record<string, string> = {};

// What a verse-chip tap on the Mind Map opens first (see BookMindMapWithLessonSheet.tsx) — that
// one verse in its sense lines, in the sheet's verse zone, and the single thing to do with it
// (Learn / Continue / Review — see lib/verseLessonAction.ts) at the bottom of the drill zone.
// Same two zones a lesson then fills, so starting one swaps the contents in place rather than
// moving anything. A not-yet-learned verse reads in the reading view's own dimmed "future" ink.
export function MindMapVersePreview({ verse, learned, actionLabel, onAction, secondary, status }: MindMapVersePreviewProps) {
  const verseZone = useLessonSessionStore((state) => state.senseCardPortalNode);
  const drillZone = useLessonSessionStore((state) => state.drillPortalNode);
  useExpandedVerseZone();
  const [columnRef, columnWidthPx] = useElementWidth<HTMLDivElement>();

  return (
    <>
      {verseZone &&
        verse &&
        createPortal(
          <SheetVerseZone>
            <div ref={columnRef} className="font-reading text-lg font-medium">
              <SenseLineVerse
                verse={verse}
                dayNumber={undefined}
                state={learned ? "completed" : "future"}
                locationTags={NO_TAGS}
                iconTags={NO_TAGS}
                pegActive={false}
                onSelect={() => {}}
                columnWidthPx={columnWidthPx}
              />
            </div>
          </SheetVerseZone>,
          verseZone,
        )}
      {drillZone && (
        <SheetDrillPortal node={drillZone}>
          {actionLabel && (
            <motion.button
              type="button"
              whileTap={TAP_SCALE}
              onClick={onAction}
              className="w-full rounded-full bg-brand-500 py-3.5 text-base font-semibold text-white shadow-[0_8px_24px_rgba(107,86,68,0.18)] hover:bg-brand-600"
            >
              {actionLabel}
            </motion.button>
          )}
          {status && (
            <p className="flex items-center justify-center gap-2 py-2 text-base font-semibold text-green-700 dark:text-green-400">
              <Check size={18} strokeWidth={3} /> {status}
            </p>
          )}
          {secondary && (
            <button type="button" onClick={secondary.onClick} className="py-1 text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300">
              {secondary.label}
            </button>
          )}
        </SheetDrillPortal>
      )}
    </>
  );
}
