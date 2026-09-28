"use client";

import { useEffect } from "react";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";

// Hides the bottom tab bar for as long as `active` is true (see AuthGate.tsx) — the Mind Map's
// lesson sheet covers the screen bottom.
export function useHideTabBarWhile(active: boolean): void {
  const beginSession = useLessonSessionStore((state) => state.begin);
  const endSession = useLessonSessionStore((state) => state.end);
  useEffect(() => {
    if (!active) return;
    beginSession();
    return endSession;
  }, [active, beginSession, endSession]);
}
