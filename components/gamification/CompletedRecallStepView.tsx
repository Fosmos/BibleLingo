"use client";

import type { RecallStep } from "@/lib/pericopeHeadingSteps";

interface CompletedRecallStepViewProps {
  step: RecallStep;
}

// A static recap of one already-finished step in a multi-pericope SRS review (see
// SrsEntityRecall.tsx) — a completed heading renders the same decorative styling
// VerseReferenceHeader.tsx uses for a real pericope line, a completed verses segment renders
// as plain fully-revealed text. Rendered above whichever step is currently active, so
// reaching a new pericope's heading gate (or its own verses) never clears the verses already
// recited — the screen only ever grows.
export function CompletedRecallStepView({ step }: CompletedRecallStepViewProps) {
  if (step.kind === "heading") {
    return (
      <p className="text-2xl font-semibold">
        <span className="text-brand-600 dark:text-brand-400">{step.heading.label}:</span>{" "}
        <span className="text-brand-800 dark:text-brand-200">{step.heading.heading}</span>
      </p>
    );
  }

  return <p className="text-lg leading-relaxed text-ink-muted dark:text-zinc-500">{step.verses.map((verse) => verse.text).join(" ")}</p>;
}
