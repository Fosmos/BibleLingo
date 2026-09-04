"use client";

import { Fragment } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { GripVertical, Merge } from "lucide-react";
import { themeForAnnotation, type WordAnnotation } from "@/lib/verseHighlights";
import { VerseNumberMarker } from "@/components/drills/VerseNumberMarker";
import { VerseTextLine } from "@/components/ui/VerseTextLine";

export interface ClauseBlock {
  id: string;
  startIndex: number;
  endIndex: number;
}

interface ClauseCardProps {
  block: ClauseBlock;
  words: string[];
  verseMarkers: Record<number, number>;
  // Only set on the card holding word index 0 — the "chapter:verse" prefix belongs to the
  // verse's own text, not to wherever that card currently sits after a drag reorder.
  verseLabel?: { chapter: number; verseNumber: number };
  annotation?: WordAnnotation;
  isSelected: boolean;
  onToggleBreak: (index: number) => void;
  onSelect: () => void;
  // Undefined on the card holding word index 0 — there's no earlier clause left to merge
  // into. Merging is always with whichever clause is word-adjacent just before this one, not
  // whatever card currently sits above it after a drag reorder.
  onMergeUp?: () => void;
}

// One draggable clause in the Orientation stage's vertical column (see VerseOrientationRep).
// Tapping anywhere on the card selects it for role assignment via the shared
// ClauseRolePalette rendered above the whole list — colors live there once instead of being
// repeated on every card; this card just shows its own currently-assigned role as a small
// dot + label in its bottom-right corner, plus its wash/border theme. Tapping a word still
// splits the clause division right there (and also selects the card, since that's exactly
// the one being edited); merging back
// with the previous clause has its own explicit button rather than relying on the reader to
// discover that tapping a boundary word un-splits it. A drag handle keeps a real drag gesture
// from fighting with either tap gesture.
export function ClauseCard({ block, words, verseMarkers, verseLabel, annotation, isSelected, onToggleBreak, onSelect, onMergeUp }: ClauseCardProps) {
  const controls = useDragControls();
  const theme = themeForAnnotation(annotation);

  return (
    <Reorder.Item
      value={block.id}
      layout="position"
      dragListener={false}
      dragControls={controls}
      onClick={onSelect}
      className={`flex items-start gap-2 rounded-lg border p-3 ${
        isSelected ? "border-ink ring-2 ring-ink dark:border-zinc-300 dark:ring-zinc-300" : "border-line dark:border-zinc-700"
      } ${theme ? theme.blockClassName : "bg-white dark:bg-zinc-900"}`}
    >
      <div className="flex shrink-0 flex-col items-center gap-1">
        <button
          type="button"
          onPointerDown={(event) => controls.start(event)}
          aria-label="Drag to reorder"
          className="mt-1 cursor-grab touch-none text-ink-muted active:cursor-grabbing"
        >
          <GripVertical size={18} />
        </button>
        {onMergeUp && (
          <button
            type="button"
            onClick={onMergeUp}
            aria-label="Merge with clause above"
            title="Merge with clause above"
            className="text-ink-muted hover:text-ink dark:hover:text-zinc-200"
          >
            <Merge size={16} className="rotate-180" />
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <p className="flex flex-wrap items-baseline gap-x-0.5 gap-y-1 text-base leading-relaxed text-ink dark:text-zinc-100">
          {verseLabel && <VerseTextLine chapter={verseLabel.chapter} verseNumber={verseLabel.verseNumber} />}
          {words.slice(block.startIndex, block.endIndex + 1).map((word, offset) => {
            const index = block.startIndex + offset;
            return (
              <Fragment key={index}>
                {verseMarkers[index] && (
                  <>
                    <span className="basis-full" />
                    <VerseNumberMarker number={verseMarkers[index]} />
                  </>
                )}
                <button
                  type="button"
                  onClick={() => onToggleBreak(index)}
                  className="rounded px-0.5 hover:bg-mist dark:hover:bg-zinc-800"
                >
                  {word}
                </button>
              </Fragment>
            );
          })}
        </p>
        {theme && (
          <span className="flex items-center gap-1 self-end text-[11px] font-semibold text-ink-muted">
            <span className={`h-2 w-2 rounded-full ${theme.swatchClassName}`} />
            {theme.label}
          </span>
        )}
      </div>
    </Reorder.Item>
  );
}
