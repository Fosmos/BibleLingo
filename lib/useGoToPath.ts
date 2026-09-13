"use client";

import { useRouter } from "next/navigation";
import type { LocationTagLevel } from "@/types";
import { pathKey } from "@/lib/memorizationContent";

export type GoToPath = (
  identifier: string,
  kind: "book" | "chapter" | "verse",
  version: string,
  versesPerDay?: number,
  locationTagLevels?: LocationTagLevel[],
  // See lib/useStartingPointFlow.ts's own "already know some of this?" step — how many days
  // to mark done right away, so the fresh path opens past whatever the reader claims to
  // already know instead of always at day 1.
  startAtCompletedDays?: number,
) => void;

// GuidedPathFlow.tsx's own final step, split out purely to keep that file under this
// codebase's 200-line cap — builds the URL and navigates to the freshly picked path.
export function useGoToPath(): GoToPath {
  const router = useRouter();
  return (identifier, kind, version, versesPerDay, locationTagLevels, startAtCompletedDays) => {
    const query = new URLSearchParams({ version });
    if (versesPerDay) query.set("versesPerDay", String(versesPerDay));
    if (locationTagLevels && locationTagLevels.length > 0) query.set("locationTagLevels", locationTagLevels.join(","));
    if (startAtCompletedDays) query.set("startAtDay", String(startAtCompletedDays));
    router.push(`/path/${encodeURIComponent(pathKey(kind, identifier))}?${query}`);
  };
}
