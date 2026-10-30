"use client";

import { useProgressStore } from "@/store/useProgressStore";
import { findPlacement, palaceToPlaceIn, type Placement, type VerseRef } from "@/lib/palacePlacement";
import type { BuiltPalace } from "@/types";

const NONE: BuiltPalace[] = [];

// A verse's spot in the reader's built palaces, and — when it isn't on one yet — the palace it'd go
// into (lib/palacePlacement.ts). Both undefined when the reader hasn't built a palace for it.
export function useVersePlacement(ref: VerseRef | undefined): { placement?: Placement; palace?: BuiltPalace } {
  const palaces = useProgressStore((state) => state.builtPalaces) ?? NONE;
  const activePathKey = useProgressStore((state) => state.activePathKey);
  if (!ref) return {};
  const placement = findPlacement(palaces, ref);
  return { placement, palace: placement?.palace ?? palaceToPlaceIn(palaces, ref, activePathKey) };
}
