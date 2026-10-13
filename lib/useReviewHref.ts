"use client";

import { useCallback } from "react";
import { useProgressStore } from "@/store/useProgressStore";
import { reviewArrivalHref } from "@/lib/useReviewArrival";
import { reviewHomePath } from "@/lib/reviewHomePath";

// Where a spaced review of these ranges runs: in place on the path the first was memorized on
// (lib/reviewHomePath.ts), else on the /review screen — the same chapter path view, opened on the
// range's own chapter without adding a path. Null only for an unknown range (callers fall back).
// `start` begins the review straight away rather than just landing on its first verse.
export function useReviewHref(): (entityIds: string[], start: boolean) => string | null {
  const entities = useProgressStore((state) => state.memorizedEntities);
  const paths = useProgressStore((state) => state.paths);
  const activePathKey = useProgressStore((state) => state.activePathKey);
  return useCallback(
    (entityIds, start) => {
      const first = entities.find((entity) => entity.id === entityIds[0]);
      if (!first) return null;
      const home = reviewHomePath(first, paths, activePathKey);
      const version = home ? paths[home]?.version : undefined;
      if (home && version) return reviewArrivalHref(home, version, entityIds, start);
      const query = new URLSearchParams({ review: entityIds.join(",") });
      if (start) query.set("start", "1");
      return `/review?${query}`;
    },
    [entities, paths, activePathKey],
  );
}
