"use client";

import { useState } from "react";
import { useProgressStore } from "@/store/useProgressStore";

// A single named numeric "how far in" value for an in-progress lesson/SRS session (e.g.
// verseIndex, phaseIndex), persisted to the store — and so to localStorage — on every
// change. Read once at mount as the resume point; write-through on every update covers any
// way of leaving (back button, closed tab, navigating elsewhere), since there's no reliable
// single "on leave" event to hook. Passing sessionKey as undefined disables persistence
// entirely and behaves like a plain useState, for call sites that don't want checkpointing.
export function useCheckpointField(
  sessionKey: string | undefined,
  field: string,
  initial: number,
): [number, (value: number) => void] {
  const stored = useProgressStore((state) => (sessionKey ? state.sessionCheckpoints[sessionKey]?.[field] : undefined));
  const patchSessionCheckpoint = useProgressStore((state) => state.patchSessionCheckpoint);
  const [value, setValue] = useState(stored ?? initial);

  function update(next: number) {
    setValue(next);
    if (sessionKey) patchSessionCheckpoint(sessionKey, field, next);
  }

  return [value, update];
}
