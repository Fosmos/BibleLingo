"use client";

import { useState } from "react";

interface Recalled {
  focus: string | null;
  keys: string[];
}

const NONE: Recalled = { focus: null, keys: [] };

// The verses a running lesson or review has already moved past on the chapter reader — each verse
// the drill's focus (lib/useReportFocusVerse.ts) left for another, i.e. typed or said through — so
// they can stay on the page in full while the rest are still blank. Starts over when nothing runs.
// Kept as state adjusted during render, so it follows the focus without an effect.
export function useRecalledVerses(focusKey: string | null, running: boolean): Set<string> {
  const [recalled, setRecalled] = useState<Recalled>(NONE);
  if (!running && recalled !== NONE) setRecalled(NONE);
  else if (running && focusKey !== recalled.focus) {
    setRecalled({ focus: focusKey, keys: recalled.focus && !recalled.keys.includes(recalled.focus) ? [...recalled.keys, recalled.focus] : recalled.keys });
  }
  return new Set(recalled.keys);
}
