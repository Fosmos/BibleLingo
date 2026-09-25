"use client";

import { useMemo } from "react";
import { useProgressStore } from "@/store/useProgressStore";
import { EMPTY_SRS_STATUS, srsScopeStatus, type SrsScope, type SrsScopeStatus } from "@/lib/srsScopeStatus";

// A Mind Map node's own SRS state (due / last review %) — see lib/srsScopeStatus.ts. `scope`
// undefined (a node kind with no Scripture range of its own, like a genre) reads as not in SRS.
export function useSrsScopeStatus(scope: SrsScope | undefined): SrsScopeStatus {
  const entities = useProgressStore((state) => state.memorizedEntities);
  const { book, chapter, startVerse, endVerse } = scope ?? {};
  return useMemo(
    () => (book ? srsScopeStatus(entities, { book, chapter, startVerse, endVerse }) : EMPTY_SRS_STATUS),
    [entities, book, chapter, startVerse, endVerse],
  );
}
