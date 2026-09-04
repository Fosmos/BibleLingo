"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { TAP_SCALE } from "@/lib/motionTokens";

interface VisualHint {
  // A verse's own location tag (see lib/locationTags.ts), when the caller has one to show —
  // the image level then shows just the reader's own POA/scene otherwise, no location to name.
  furnitureLabel?: string;
  who: string;
  action: string;
  additionalInfo: string;
  scene: string;
}

interface VerseRevealHelpProps {
  reference: string;
  fullText: string;
  firstLettersText: string;
  // Set whenever this verse has a saved Visualize POA (see setVersePOA) — when present, the
  // reveal sequence opens with this gentlest level before first letters, then the whole word.
  visualHint?: VisualHint;
  // "firstLetters": the trigger opens a first-letters view, with a further button inside to
  // escalate to the whole verse. "full": the trigger jumps straight to the whole verse (used
  // when the stage already shows first letters as its own baseline display). Ignored (starts
  // at "image" instead) whenever visualHint is set.
  startLevel: "firstLetters" | "full";
  // Caps how far the escalation button can go — "firstLetters" removes the "Show whole
  // verse" button once at that level, so a stage testing recall of the whole verse never
  // hands back the actual answer. Defaults to "full" (today's stages generally re-teach a
  // verse they've already shown once elsewhere in the lesson, so no such cap applies).
  maxLevel?: "firstLetters" | "full";
  // Fires when the overlay is dismissed at ANY level — the caller uses this to restart the
  // stage (e.g. bump a remount key), since peeking at the answer costs a fresh start.
  onReset: () => void;
}

type OverlayLevel = "closed" | "image" | "firstLetters" | "full";

// A "peek at the answer" escape hatch for stages that hide the verse (fully or down to just
// first letters) — see LearnSection.tsx and SrsReviewSession.tsx for which stages wire this
// in. Stays open as long as the user wants; closing it at any level restarts the stage it's
// attached to. Escalates through up to 3 levels, gentlest first: the reader's own visualized
// image (their Person/Action/Object scene, when available), then first letters, then the
// whole word.
export function VerseRevealHelp({ reference, fullText, firstLettersText, visualHint, startLevel, maxLevel = "full", onReset }: VerseRevealHelpProps) {
  const [level, setLevel] = useState<OverlayLevel>("closed");
  const openLevel = visualHint ? "image" : startLevel;

  function close() {
    setLevel("closed");
    onReset();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setLevel(openLevel)}
        className="flex items-center gap-1.5 self-start text-sm font-medium text-brand-600 hover:underline"
      >
        <Eye size={14} />
        {openLevel === "full" ? "Show whole verse" : openLevel === "image" ? "Show a hint" : "Show first letters"}
      </button>
      {level !== "closed" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={close}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-white p-6 dark:bg-zinc-900"
          >
            <p className="text-caption font-semibold uppercase tracking-wide text-brand-500">{reference}</p>
            {level === "image" && visualHint ? (
              <div className="flex flex-col gap-1.5 text-lg leading-relaxed">
                <p>
                  <span className="font-semibold">{visualHint.who}</span> {visualHint.action} {visualHint.additionalInfo}
                  {visualHint.furnitureLabel && (
                    <>
                      {" "}
                      on the <span className="font-semibold">{visualHint.furnitureLabel}</span>
                    </>
                  )}
                </p>
                {visualHint.scene && <p className="text-base italic text-ink-muted">{visualHint.scene}</p>}
              </div>
            ) : (
              <p className="text-lg leading-relaxed">{level === "full" ? fullText : firstLettersText}</p>
            )}
            <div className="flex items-center justify-between gap-3">
              {level === "image" ? (
                <button type="button" onClick={() => setLevel("firstLetters")} className="text-sm font-medium text-brand-600 hover:underline">
                  Show first letters
                </button>
              ) : level === "firstLetters" && maxLevel === "full" ? (
                <button type="button" onClick={() => setLevel("full")} className="text-sm font-medium text-brand-600 hover:underline">
                  Show whole verse
                </button>
              ) : (
                <span />
              )}
              <motion.button
                type="button"
                whileTap={TAP_SCALE}
                onClick={close}
                className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white"
              >
                Close &amp; restart stage
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
