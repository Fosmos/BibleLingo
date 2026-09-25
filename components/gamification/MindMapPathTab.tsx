"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { isPathKeyLearned } from "@/lib/pathCompletion";
import { useProgressStore } from "@/store/useProgressStore";
import { pathTargetKey, pathTargetLabel, type PathTarget } from "@/lib/mindMapPathTarget";
import { useOpenPath } from "@/lib/useOpenPath";
import { useActivePathKeys } from "@/lib/useActivePathKeys";
import { MOTION_DURATION, MOTION_EASE, TAP_SCALE } from "@/lib/motionTokens";

interface MindMapPathTabProps {
  // The book/chapter/verse last tapped outside the active path; null hides the tab.
  target: PathTarget | null;
  // Opens the full setup sheet (translation, pace, intensity — see MindMapPathSetup.tsx).
  onMemorize: (target: PathTarget) => void;
  onClose: () => void;
}

const KIND_CAPTION: Record<PathTarget["kind"], string> = { book: "Book", chapter: "Chapter", verse: "Verse" };

// The small tab that pops up over the bottom of the Mind Map when a book, chapter or verse
// outside the active path is tapped — choosing a path is done by navigating the map itself. It
// stays out of the way (the map remains fully visible and usable; the next tap just retargets
// it). A path already started offers to continue it instead, with a fresh start as the option.
export function MindMapPathTab({ target, onMemorize, onClose }: MindMapPathTabProps) {
  const key = target ? pathTargetKey(target) : "";
  const existing = useProgressStore((state) => (key ? state.paths[key] : undefined));
  const openPath = useOpenPath();
  // Already one of the reader's active paths (just not the one on the map): "Switch to" it.
  const isActive = useActivePathKeys().includes(key);
  // Finished: every verse learned (see lib/pathCompletion.ts) — shown as done, not to continue.
  const finished = existing ? isPathKeyLearned(key, existing) === true : false;

  return (
    <AnimatePresence>
      {target && (
        <motion.div
          key="path-tab"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE.enter }}
          className="fixed inset-x-3 bottom-[calc(120px+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-parchment px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="min-w-0 flex-1">
            <p className="text-caption font-semibold uppercase tracking-wide text-ink-muted">{KIND_CAPTION[target.kind]}</p>
            <p className="truncate font-serif text-lg font-bold text-ink dark:text-zinc-100">{pathTargetLabel(target)}</p>
            {existing && !finished && <p className="text-xs text-ink-muted">{existing.completedDays} lessons done</p>}
            {finished && (
              <p className="flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400">
                <Check size={12} strokeWidth={3} /> Memorized
              </p>
            )}
          </div>
          {finished ? (
            <button type="button" onClick={() => onMemorize(target)} className="shrink-0 text-sm font-medium text-ink-muted hover:underline">
              Memorize again
            </button>
          ) : existing ? (
            <div className="flex shrink-0 flex-col items-end gap-1">
              <motion.button type="button" whileTap={TAP_SCALE} onClick={() => openPath(key, existing.version)} className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
                {isActive ? "Switch to" : "Continue"}
              </motion.button>
              <button type="button" onClick={() => onMemorize(target)} className="text-xs font-medium text-ink-muted hover:underline">
                Start over
              </button>
            </div>
          ) : (
            <motion.button type="button" whileTap={TAP_SCALE} onClick={() => onMemorize(target)} className="shrink-0 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
              Memorize
            </motion.button>
          )}
          <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 rounded-full p-1 text-ink-muted hover:bg-mist dark:hover:bg-zinc-800">
            <X size={18} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
