"use client";

import { useState } from "react";

interface PendingCelebration {
  text?: string;
  onDone: () => void;
}

// Lets an orchestrator queue a SectionCompleteOverlay instead of advancing immediately —
// call celebrate(realAdvanceFn, optionalText) where you'd otherwise call the advance
// function directly; render the overlay when `pending` is set, passing `finish` as its
// onDone so the queued advance runs once the overlay's own delay elapses.
export function useCelebration() {
  const [pending, setPending] = useState<PendingCelebration | null>(null);

  function celebrate(onDone: () => void, text?: string) {
    setPending({ onDone, text });
  }

  function finish() {
    if (!pending) return;
    const { onDone } = pending;
    setPending(null);
    onDone();
  }

  return { pending, celebrate, finish };
}
