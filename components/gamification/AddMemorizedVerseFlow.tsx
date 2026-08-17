"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useProgressStore } from "@/store/useProgressStore";
import { formatVerseSpanLabel } from "@/lib/chapterContent";
import type { SrsPhase } from "@/lib/srs";
import { TAP_SCALE } from "@/lib/motionTokens";
import { ManualVerseRangeForm, type VerseRangeSelection } from "@/components/gamification/ManualVerseRangeForm";
import { ManualWholeBookForm, type WholeBookSelection } from "@/components/gamification/ManualWholeBookForm";
import { SrsPhasePicker } from "@/components/gamification/SrsPhasePicker";

type Step = "closed" | "mode" | "range" | "book" | "phase" | "done";

// Lets the user add verses they'd already memorized before using the app: pick either a
// specific book/chapter/verse range or an entire book (validated against real fetched
// chapter content, since verse counts aren't pre-authored), then choose which SRS phase it
// should start in — so a verse known for years doesn't have to re-enter at the very
// beginning of daily review.
export function AddMemorizedVerseFlow() {
  const [step, setStep] = useState<Step>("closed");
  const [rangeSelection, setRangeSelection] = useState<VerseRangeSelection | null>(null);
  const [bookSelection, setBookSelection] = useState<WholeBookSelection | null>(null);
  const addManualMemorizedEntity = useProgressStore((state) => state.addManualMemorizedEntity);
  const addManualMemorizedBook = useProgressStore((state) => state.addManualMemorizedBook);

  function reset() {
    setStep("closed");
    setRangeSelection(null);
    setBookSelection(null);
  }

  function handleValidRange(range: VerseRangeSelection) {
    setRangeSelection(range);
    setStep("phase");
  }

  function handleValidBook(selection: WholeBookSelection) {
    setBookSelection(selection);
    setStep("phase");
  }

  function handleSelectPhase(phase: SrsPhase) {
    if (rangeSelection) {
      addManualMemorizedEntity(
        rangeSelection.book,
        rangeSelection.chapter,
        rangeSelection.startVerse,
        rangeSelection.endVerse,
        phase,
        rangeSelection.version,
      );
    } else if (bookSelection) {
      addManualMemorizedBook(bookSelection.book, bookSelection.chapterVerseCounts, phase, bookSelection.version);
    } else {
      return;
    }
    setStep("done");
  }

  if (step === "closed") {
    return (
      <motion.button
        type="button"
        whileTap={TAP_SCALE}
        onClick={() => setStep("mode")}
        className="rounded-2xl border border-dashed border-brand-300 bg-brand-500/5 p-4 text-center text-sm font-medium text-brand-700 transition-colors hover:bg-brand-500/10 dark:border-brand-800 dark:text-brand-300"
      >
        + Add a verse you already know
      </motion.button>
    );
  }

  const label = rangeSelection
    ? formatVerseSpanLabel(rangeSelection.book, rangeSelection.chapter, rangeSelection.startVerse, rangeSelection.endVerse)
    : bookSelection
      ? `the book of ${bookSelection.book}`
      : "";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      {step === "mode" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-ink-soft dark:text-zinc-300">What do you already know?</p>
          <div className="flex flex-col gap-2">
            <motion.button
              type="button"
              whileTap={TAP_SCALE}
              onClick={() => setStep("range")}
              className="flex flex-col items-start gap-1 rounded-xl border border-line bg-white p-4 text-left dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="text-sm font-semibold text-ink dark:text-zinc-200">A specific range</span>
              <span className="text-xs text-ink-muted">One or more verses within a single chapter.</span>
            </motion.button>
            <motion.button
              type="button"
              whileTap={TAP_SCALE}
              onClick={() => setStep("book")}
              className="flex flex-col items-start gap-1 rounded-xl border border-line bg-white p-4 text-left dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="text-sm font-semibold text-ink dark:text-zinc-200">A whole book</span>
              <span className="text-xs text-ink-muted">Every chapter and verse of one book at once.</span>
            </motion.button>
          </div>
          <button type="button" onClick={reset} className="self-start text-sm font-medium text-ink-muted hover:underline">
            Cancel
          </button>
        </div>
      )}
      {step === "range" && <ManualVerseRangeForm onValid={handleValidRange} onCancel={reset} />}
      {step === "book" && <ManualWholeBookForm onValid={handleValidBook} onCancel={reset} />}
      {step === "phase" && (
        <SrsPhasePicker label={label} onSelectPhase={handleSelectPhase} onBack={() => setStep("mode")} />
      )}
      {step === "done" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-ink-soft dark:text-zinc-300">Added {label} to your spaced review.</p>
          <button type="button" onClick={reset} className="self-start text-sm font-medium text-brand-600 hover:underline">
            Add another
          </button>
        </div>
      )}
    </div>
  );
}
