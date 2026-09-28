"use client";

import { useEffect } from "react";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";

// Called by a Mind Map sheet screen whose drill zone holds just one button (the verse preview's
// action, a workspace stage's Continue) — for as long as it's mounted, LessonBottomSheet.tsx lets
// the verse zone take all the height above that button instead of stopping at the lesson's even
// 30/30 split. A counter, not a flag, so one stage's unmount can't cancel the next stage's mount.
export function useExpandedVerseZone(active = true): void {
  const add = useLessonSessionStore((state) => state.addExpandedVerseZoneUser);
  const remove = useLessonSessionStore((state) => state.removeExpandedVerseZoneUser);

  useEffect(() => {
    if (!active) return;
    add();
    return remove;
  }, [active, add, remove]);
}
