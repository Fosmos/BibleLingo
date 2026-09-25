"use client";

import { useEffect } from "react";
import { useProgressStore } from "@/store/useProgressStore";
import { useActivePathKeys } from "@/lib/useActivePathKeys";
import { isPathKeyLearned } from "@/lib/pathCompletion";

// Keeps finished paths out of the reader's active paths: any active path whose every verse is
// already learned — finished before paths retired themselves on completion (see
// lib/completeDayEffects.ts), say — is dropped, with its verses put into spaced review. Checked
// whenever the active set or progress changes; a path whose content isn't cached yet is left
// until it is.
export function useRetireLearnedPaths(): void {
  const keys = useActivePathKeys();
  const paths = useProgressStore((state) => state.paths);
  const retire = useProgressStore((state) => state.retireLearnedPath);

  useEffect(() => {
    for (const key of keys) {
      if (isPathKeyLearned(key, paths[key])) retire(key);
    }
  }, [keys, paths, retire]);
}
