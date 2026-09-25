"use client";

import { useShallow } from "zustand/react/shallow";
import { useProgressStore } from "@/store/useProgressStore";
import { activePathKeysOf } from "@/lib/activePaths";

// Every active path (see lib/activePaths.ts), subscribed — a stable array that only changes when
// the set really does.
export function useActivePathKeys(): string[] {
  return useProgressStore(useShallow(activePathKeysOf));
}
