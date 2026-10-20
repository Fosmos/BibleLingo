"use client";

import { useEffect } from "react";
import type { VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";

// Once a path's verses are loaded (and its pericopes, which its days chunk by), every verse learned
// on it goes into spaced review — from the verses in hand, since a book path doesn't resolve from
// the local chapter cache alone once one of its chapters has been evicted. Only ever adds.
export function usePathVersesCatchUp(pathKey: string, version: string, verses: VerseSegment[] | null, ready: boolean): void {
  const plan = useProgressStore((state) => state.paths[pathKey]);
  const catchUpPathVerses = useProgressStore((state) => state.catchUpPathVerses);
  const planVersion = plan?.version;
  const completedDays = plan?.completedDays;
  const versesIntoDay = plan?.versesIntoDay;
  useEffect(() => {
    if (verses && ready && planVersion === version) catchUpPathVerses(pathKey, verses);
  }, [pathKey, version, verses, ready, planVersion, completedDays, versesIntoDay, catchUpPathVerses]);
}
