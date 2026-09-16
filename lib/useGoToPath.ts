"use client";

import { useRouter } from "next/navigation";
import type { LocationTagLevel } from "@/types";
import { pathKey } from "@/lib/memorizationContent";
import { useProgressStore } from "@/store/useProgressStore";

export type GoToPath = (
  identifier: string,
  kind: "book" | "chapter" | "verse",
  version: string,
  versesPerDay?: number,
  locationTagLevels?: LocationTagLevel[],
  sectionEndPegEnabled?: boolean,
  // See lib/useStartingPointFlow.ts's own "already know some of this?" step — how many of this
  // path's own verses (array position, not a verse NUMBER) to exclude from lesson chunking
  // entirely, so the fresh path's day 1 starts right at the next verse instead of always at
  // the very beginning.
  priorKnownVerseCount?: number,
) => void;

// GuidedPathFlow.tsx's own final step, split out purely to keep that file under this
// codebase's 200-line cap — builds the URL and navigates to a freshly (re-)started path.
export function useGoToPath(): GoToPath {
  const router = useRouter();
  const resetPathProgress = useProgressStore((state) => state.resetPathProgress);
  return (identifier, kind, version, versesPerDay, locationTagLevels, sectionEndPegEnabled, priorKnownVerseCount) => {
    const key = pathKey(kind, identifier);
    // Re-picking a path through this flow (reached via "Switch Path") always starts fresh —
    // see store/useProgressStore.ts's resetPathProgress. A no-op for a path with no progress
    // yet, so a brand-new pick is unaffected.
    resetPathProgress(key);
    const query = new URLSearchParams({ version });
    if (versesPerDay) query.set("versesPerDay", String(versesPerDay));
    if (locationTagLevels && locationTagLevels.length > 0) query.set("locationTagLevels", locationTagLevels.join(","));
    if (sectionEndPegEnabled) query.set("sectionEndPeg", "1");
    if (priorKnownVerseCount) query.set("priorKnownVerseCount", String(priorKnownVerseCount));
    router.push(`/path/${encodeURIComponent(key)}?${query}`);
  };
}
