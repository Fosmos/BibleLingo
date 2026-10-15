"use client";

import { useRouter } from "next/navigation";
import type { PathReminder } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";

export interface NewPathStart {
  key: string;
  version: string;
  versesPerDay?: number;
  priorKnownVerseCount?: number;
  reminder: PathReminder;
}

// Setup's last step: a fresh start on the path (any old progress on it reset, as lib/useGoToPath.ts
// does), its reminder saved, and on to its trail with "Path ready — first lesson is up".
export function useStartNewPath(): (start: NewPathStart) => void {
  const router = useRouter();
  const resetPathProgress = useProgressStore((state) => state.resetPathProgress);
  const setPathReminder = useProgressStore((state) => state.setPathReminder);
  return ({ key, version, versesPerDay, priorKnownVerseCount, reminder }) => {
    resetPathProgress(key);
    setPathReminder(key, reminder);
    const query = new URLSearchParams({ version, toast: "ready", section: "current" });
    if (versesPerDay) query.set("versesPerDay", String(versesPerDay));
    if (priorKnownVerseCount) query.set("priorKnownVerseCount", String(priorKnownVerseCount));
    router.push(`/path/${encodeURIComponent(key)}?${query}`);
  };
}
